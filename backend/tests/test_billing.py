"""
Tests for invoice generation, payment status updates, and revenue report accuracy.

Covers:
  - POST   /api/invoices           (invoice generation)
  - PUT    /api/invoices/<id>      (payment status updates)
  - DELETE /api/invoices/<id>      (invoice removal)
  - GET    /api/invoices           (invoice listing)
  - GET    /api/reports/daily-revenue  (revenue report accuracy)
"""

import pytest
from datetime import date, datetime, timezone

from app import db
from app.models.appointment import Appointment
from app.models.cpt import CPT
from app.models.cpt_code import CPTCode
from app.models.insurance_plan import InsurancePlan
from app.models.invoice import Invoice


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def cpt_code(app):
    """Standard office-visit CPT code used by invoice-generation tests."""
    code = CPTCode(
        code="99213",
        description="Office Visit – Established Patient",
        category="Office Visit",
        default_price=150.00,
    )
    db.session.add(code)
    db.session.commit()
    return code


@pytest.fixture
def revenue_cpt_code(app):
    """Separate CPT code for revenue-report tests (avoids unique-code conflicts)."""
    code = CPTCode(
        code="99214",
        description="Office Visit – Moderate Complexity",
        category="Office Visit",
        default_price=200.00,
    )
    db.session.add(code)
    db.session.commit()
    return code


@pytest.fixture
def active_insurance_plan(app, sample_patient):
    """Active insurance profile required for billing (copay-based breakdown)."""
    plan = InsurancePlan(
        patient_id=sample_patient.patient_id,
        carrier_name="Aetna",
        member_id="MEM123",
        group_id="GRP1",
        plan_type="PPO",
        copay=25.00,
        is_active=True,
    )
    db.session.add(plan)
    db.session.commit()
    return plan


@pytest.fixture
def cpt_record(app, sample_patient, cpt_code):
    """A paid CPT billing record linked to sample_patient."""
    record = CPT(
        patient_id=sample_patient.patient_id,
        cpt_code_id=cpt_code.cpt_code_id,
        service_date=date(2026, 6, 1),
        status="paid",
        subtotal=150.00,
        tax=15.00,
    )
    db.session.add(record)
    db.session.commit()
    return record


@pytest.fixture
def completed_appointment(
    app, sample_patient, doctor_user, cpt_record, active_insurance_plan
):
    """A completed appointment with an associated CPT record — required for invoice creation."""
    appt = Appointment(
        patient_id=sample_patient.patient_id,
        provider_user_id=doctor_user.user_id,
        scheduled_start=datetime(2026, 6, 1, 9, 0, tzinfo=timezone.utc),
        scheduled_end=datetime(2026, 6, 1, 9, 30, tzinfo=timezone.utc),
        status="completed",
        reason="Annual check-up",
        cpt_id=cpt_record.cpt_id,
    )
    db.session.add(appt)
    db.session.commit()
    return appt


@pytest.fixture
def sample_invoice(app, completed_appointment, cpt_record, sample_patient):
    """A pre-existing unpaid invoice for use in update / delete / list tests."""
    inv = Invoice(
        appointment_id=completed_appointment.appointment_id,
        cpt_id=cpt_record.cpt_id,
        patient_id=sample_patient.patient_id,
    )
    db.session.add(inv)
    db.session.commit()
    return inv


# ---------------------------------------------------------------------------
# Invoice Generation Tests  (POST /api/invoices)
# ---------------------------------------------------------------------------


class TestInvoiceGeneration:
    def test_create_invoice_requires_active_insurance_profile(
        self, client, auth_headers, doctor_user, cpt_code
    ):
        """Billing requires an active insurance profile; otherwise invoice creation returns 400."""
        from app.models.patient import Patient

        patient = Patient(
            first_name="No",
            last_name="Insurance",
            dob=date(1991, 1, 1),
            sex="female",
            email="no.insurance@test.com",
        )
        db.session.add(patient)
        db.session.commit()

        record = CPT(
            patient_id=patient.patient_id,
            cpt_code_id=cpt_code.cpt_code_id,
            service_date=date(2026, 6, 1),
            status="paid",
            subtotal=150.00,
            tax=15.00,
        )
        db.session.add(record)
        db.session.commit()

        appt = Appointment(
            patient_id=patient.patient_id,
            provider_user_id=doctor_user.user_id,
            scheduled_start=datetime(2026, 6, 1, 9, 0, tzinfo=timezone.utc),
            scheduled_end=datetime(2026, 6, 1, 9, 30, tzinfo=timezone.utc),
            status="completed",
            reason="Annual check-up",
            cpt_id=record.cpt_id,
        )
        db.session.add(appt)
        db.session.commit()

        resp = client.post(
            "/api/invoices",
            json={"appointment_id": appt.appointment_id},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "insurance" in resp.get_json()["error"].lower()

    def test_create_invoice_success(self, client, auth_headers, completed_appointment):
        """Admin can create an invoice for a completed appointment that has a CPT."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": completed_appointment.appointment_id},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.get_json()["message"] == "Invoice created successfully"

    def test_create_invoice_response_fields(
        self, client, auth_headers, completed_appointment, sample_patient, cpt_record
    ):
        """Created invoice response contains all required fields with correct initial values."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": completed_appointment.appointment_id},
            headers=auth_headers,
        )
        inv = resp.get_json()["invoice"]

        assert inv["invoice_id"] is not None
        assert inv["appointment_id"] == completed_appointment.appointment_id
        assert inv["cpt_id"] == cpt_record.cpt_id
        assert inv["patient_id"] == sample_patient.patient_id
        assert inv["status"] == "unpaid"
        assert inv["paid_at"] is None
        assert inv["issued_at"] is not None

    def test_create_invoice_default_status_is_unpaid(
        self, client, auth_headers, completed_appointment
    ):
        """Newly created invoices always start as 'unpaid'."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": completed_appointment.appointment_id},
            headers=auth_headers,
        )
        assert resp.get_json()["invoice"]["status"] == "unpaid"

    def test_create_invoice_no_body_returns_400(self, client, auth_headers):
        """JSON body that is null (not an object) returns 400 'Request must be JSON'."""
        # Sending null as the JSON body — get_json() returns None → triggers the "not data" guard.
        resp = client.post(
            "/api/invoices",
            data=b"null",
            content_type="application/json",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "error" in resp.get_json()

    def test_create_invoice_missing_appointment_id_returns_400(
        self, client, auth_headers
    ):
        """Request body with keys but no appointment_id returns 400."""
        # A non-empty dict avoids the `not data` guard and reaches the appointment_id check.
        resp = client.post(
            "/api/invoices",
            json={"notes": "missing appointment_id field"},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "appointment_id" in resp.get_json()["error"].lower()

    def test_create_invoice_appointment_not_found_returns_404(
        self, client, auth_headers
    ):
        """Non-existent appointment_id returns 404."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": 99999},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_create_invoice_appointment_not_completed_returns_400(
        self, client, auth_headers, sample_appointment
    ):
        """Appointment in 'scheduled' status cannot be invoiced — returns 400."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": sample_appointment.appointment_id},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "completed" in resp.get_json()["error"].lower()

    def test_create_invoice_appointment_without_cpt_returns_400(
        self, client, auth_headers, sample_patient, doctor_user
    ):
        """Completed appointment with no CPT (cpt_id=None) cannot be invoiced — returns 400."""
        appt = Appointment(
            patient_id=sample_patient.patient_id,
            provider_user_id=doctor_user.user_id,
            scheduled_start=datetime(2026, 7, 1, 10, 0, tzinfo=timezone.utc),
            scheduled_end=datetime(2026, 7, 1, 10, 30, tzinfo=timezone.utc),
            status="completed",
            cpt_id=None,
        )
        db.session.add(appt)
        db.session.commit()

        resp = client.post(
            "/api/invoices",
            json={"appointment_id": appt.appointment_id},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "cpt" in resp.get_json()["error"].lower()

    def test_create_invoice_duplicate_returns_409(
        self, client, auth_headers, completed_appointment, sample_invoice
    ):
        """Creating a second invoice for the same appointment returns 409 Conflict."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": completed_appointment.appointment_id},
            headers=auth_headers,
        )
        assert resp.status_code == 409
        assert "already exists" in resp.get_json()["error"].lower()

    def test_create_invoice_unauthenticated_returns_401(
        self, client, completed_appointment
    ):
        """Request without auth token returns 401."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": completed_appointment.appointment_id},
        )
        assert resp.status_code == 401

    def test_create_invoice_nurse_forbidden_returns_403(
        self, client, nurse_auth_headers, completed_appointment
    ):
        """Nurse role is not permitted to create invoices — returns 403."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": completed_appointment.appointment_id},
            headers=nurse_auth_headers,
        )
        assert resp.status_code == 403

    def test_create_invoice_doctor_allowed(
        self, client, doctor_auth_headers, completed_appointment
    ):
        """Doctor role is authorized to create invoices."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": completed_appointment.appointment_id},
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 201

    def test_create_invoice_receptionist_allowed(
        self, client, receptionist_auth_headers, completed_appointment
    ):
        """Receptionist role is authorized to create invoices."""
        resp = client.post(
            "/api/invoices",
            json={"appointment_id": completed_appointment.appointment_id},
            headers=receptionist_auth_headers,
        )
        assert resp.status_code == 201

    def test_list_invoices_returns_seeded_invoice(
        self, client, auth_headers, sample_invoice
    ):
        """GET /api/invoices returns a list that includes the seeded invoice."""
        resp = client.get("/api/invoices", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        invoice_ids = [inv["invoice_id"] for inv in data]
        assert sample_invoice.invoice_id in invoice_ids

    def test_list_invoices_unauthenticated_returns_401(self, client):
        """GET /api/invoices without a token returns 401."""
        resp = client.get("/api/invoices")
        assert resp.status_code == 401

    def test_list_invoices_nurse_forbidden(self, client, nurse_auth_headers):
        """Nurse cannot list invoices — returns 403."""
        resp = client.get("/api/invoices", headers=nurse_auth_headers)
        assert resp.status_code == 403

    def test_delete_invoice_admin_success(self, client, auth_headers, sample_invoice):
        """Admin can permanently delete an invoice; it no longer appears in the DB."""
        invoice_id = sample_invoice.invoice_id
        resp = client.delete(f"/api/invoices/{invoice_id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["invoice_id"] == invoice_id
        assert Invoice.query.get(invoice_id) is None

    def test_delete_invoice_not_found_returns_404(self, client, auth_headers):
        """Deleting a non-existent invoice returns 404."""
        resp = client.delete("/api/invoices/99999", headers=auth_headers)
        assert resp.status_code == 404

    def test_delete_invoice_doctor_forbidden(
        self, client, doctor_auth_headers, sample_invoice
    ):
        """Doctor cannot delete invoices — returns 403."""
        resp = client.delete(
            f"/api/invoices/{sample_invoice.invoice_id}",
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 403

    def test_delete_invoice_receptionist_forbidden(
        self, client, receptionist_auth_headers, sample_invoice
    ):
        """Receptionist cannot delete invoices — returns 403."""
        resp = client.delete(
            f"/api/invoices/{sample_invoice.invoice_id}",
            headers=receptionist_auth_headers,
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Payment Status Update Tests  (PUT /api/invoices/<id>)
# ---------------------------------------------------------------------------


class TestPaymentStatusUpdates:
    def test_mark_invoice_paid_returns_200(self, client, auth_headers, sample_invoice):
        """Updating status to 'paid' returns 200 with the updated invoice."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        inv = resp.get_json()["invoice"]
        assert inv["status"] == "paid"

    def test_mark_invoice_paid_sets_paid_at(self, client, auth_headers, sample_invoice):
        """paid_at is populated with a valid ISO timestamp when status is set to 'paid'."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=auth_headers,
        )
        paid_at_str = resp.get_json()["invoice"]["paid_at"]
        assert paid_at_str is not None
        # Must parse without raising an exception
        parsed = datetime.fromisoformat(paid_at_str)
        assert isinstance(parsed, datetime)

    def test_mark_invoice_unpaid_clears_paid_at(
        self, client, auth_headers, sample_invoice
    ):
        """Reverting a paid invoice to 'unpaid' clears paid_at back to None."""
        client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=auth_headers,
        )
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "unpaid"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        inv = resp.get_json()["invoice"]
        assert inv["status"] == "unpaid"
        assert inv["paid_at"] is None

    def test_update_invoice_response_contains_all_fields(
        self, client, auth_headers, sample_invoice
    ):
        """Updated invoice response includes every expected field."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=auth_headers,
        )
        inv = resp.get_json()["invoice"]
        for field in (
            "invoice_id",
            "appointment_id",
            "cpt_id",
            "patient_id",
            "status",
            "issued_at",
            "paid_at",
        ):
            assert field in inv, f"Missing field in response: '{field}'"

    def test_update_invoice_invalid_status_returns_400(
        self, client, auth_headers, sample_invoice
    ):
        """An unrecognised status value (e.g. 'pending') returns 400."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "pending"},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "invalid status" in resp.get_json()["error"].lower()

    def test_update_invoice_missing_status_field_returns_400(
        self, client, auth_headers, sample_invoice
    ):
        """Body without a 'status' key returns 400."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"notes": "forgotten status"},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "status" in resp.get_json()["error"].lower()

    def test_update_invoice_empty_body_returns_400(
        self, client, auth_headers, sample_invoice
    ):
        """Empty JSON body returns 400."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_update_invoice_not_found_returns_404(self, client, auth_headers):
        """Updating a non-existent invoice returns 404."""
        resp = client.put(
            "/api/invoices/99999",
            json={"status": "paid"},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_update_invoice_unauthenticated_returns_401(self, client, sample_invoice):
        """Request without auth token returns 401."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
        )
        assert resp.status_code == 401

    def test_update_invoice_doctor_forbidden_returns_403(
        self, client, doctor_auth_headers, sample_invoice
    ):
        """Doctor cannot update payment status — only admin/receptionist allowed."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 403

    def test_update_invoice_nurse_forbidden_returns_403(
        self, client, nurse_auth_headers, sample_invoice
    ):
        """Nurse cannot update payment status — returns 403."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=nurse_auth_headers,
        )
        assert resp.status_code == 403

    def test_update_invoice_receptionist_allowed(
        self, client, receptionist_auth_headers, sample_invoice
    ):
        """Receptionist is permitted to update invoice payment status."""
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=receptionist_auth_headers,
        )
        assert resp.status_code == 200

    def test_idempotent_paid_update(self, client, auth_headers, sample_invoice):
        """Marking an already-paid invoice as 'paid' again is idempotent (200, status unchanged)."""
        client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=auth_headers,
        )
        resp = client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.get_json()["invoice"]["status"] == "paid"

    def test_status_persisted_in_database(
        self, client, auth_headers, sample_invoice, app
    ):
        """After marking as paid, the DB record reflects the updated status."""
        client.put(
            f"/api/invoices/{sample_invoice.invoice_id}",
            json={"status": "paid"},
            headers=auth_headers,
        )
        with app.app_context():
            db_invoice = Invoice.query.get(sample_invoice.invoice_id)
            assert db_invoice.status == "paid"
            assert db_invoice.paid_at is not None


# ---------------------------------------------------------------------------
# Revenue Report Accuracy Tests  (GET /api/reports/daily-revenue)
# ---------------------------------------------------------------------------


class TestRevenueReportAccuracy:
    """
    All tests use REPORT_DATE so records from different test functions
    do not bleed into each other (each test gets its own fresh DB via the
    function-scoped `app` fixture).
    """

    REPORT_DATE = "2026-05-10"
    REPORT_DATE_OBJ = date(2026, 5, 10)

    def _seed(
        self,
        patient_id,
        code_id,
        service_date,
        status,
        subtotal,
        tax,
        billing_date=None,
    ):
        """Insert a CPT record directly into the current DB session."""
        record = CPT(
            patient_id=patient_id,
            cpt_code_id=code_id,
            service_date=service_date,
            billing_date=billing_date,
            status=status,
            subtotal=subtotal,
            tax=tax,
        )
        db.session.add(record)
        db.session.commit()
        return record

    # ---- Accuracy & aggregation ----

    def test_paid_records_summed_correctly(
        self, client, auth_headers, sample_patient, revenue_cpt_code
    ):
        """Total revenue equals the sum of all paid CPT subtotals and taxes for the date."""
        pid = sample_patient.patient_id
        cid = revenue_cpt_code.cpt_code_id
        self._seed(
            pid,
            cid,
            self.REPORT_DATE_OBJ,
            "paid",
            100.00,
            10.00,
            billing_date=self.REPORT_DATE_OBJ,
        )  # $110
        self._seed(
            pid,
            cid,
            self.REPORT_DATE_OBJ,
            "paid",
            200.00,
            20.00,
            billing_date=self.REPORT_DATE_OBJ,
        )  # $220

        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert data["subtotal"] == 330.00
        assert data["tax"] == 0.00
        assert data["total_revenue"] == 330.00

    def test_transaction_count_matches_paid_records(
        self, client, auth_headers, sample_patient, revenue_cpt_code
    ):
        """transaction_count reflects the exact number of paid CPT records for the date."""
        pid = sample_patient.patient_id
        cid = revenue_cpt_code.cpt_code_id
        for _ in range(4):
            self._seed(
                pid,
                cid,
                self.REPORT_DATE_OBJ,
                "paid",
                50.00,
                5.00,
                billing_date=self.REPORT_DATE_OBJ,
            )

        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        assert resp.get_json()["transaction_count"] == 4

    def test_subtotal_and_tax_breakdown_correct(
        self, client, auth_headers, sample_patient, revenue_cpt_code
    ):
        """subtotal and tax are reported separately and correctly alongside total_revenue."""
        pid = sample_patient.patient_id
        cid = revenue_cpt_code.cpt_code_id
        self._seed(
            pid,
            cid,
            self.REPORT_DATE_OBJ,
            "paid",
            300.00,
            27.00,
            billing_date=self.REPORT_DATE_OBJ,
        )

        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        data = resp.get_json()["data"]
        assert data["subtotal"] == 327.00
        assert data["tax"] == 0.00
        assert data["total_revenue"] == 327.00

    # ---- Status filtering ----

    def test_draft_records_excluded(
        self, client, auth_headers, sample_patient, revenue_cpt_code
    ):
        """Draft CPT records do not contribute to revenue totals."""
        self._seed(
            sample_patient.patient_id,
            revenue_cpt_code.cpt_code_id,
            self.REPORT_DATE_OBJ,
            "draft",
            500.00,
            50.00,
        )
        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        data = resp.get_json()
        assert data["transaction_count"] == 0
        assert data["data"]["total_revenue"] == 0.0

    def test_submitted_records_excluded(
        self, client, auth_headers, sample_patient, revenue_cpt_code
    ):
        """Submitted CPT records do not contribute to revenue totals."""
        self._seed(
            sample_patient.patient_id,
            revenue_cpt_code.cpt_code_id,
            self.REPORT_DATE_OBJ,
            "submitted",
            300.00,
            30.00,
        )
        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        assert resp.get_json()["transaction_count"] == 0

    def test_overdue_records_excluded(
        self, client, auth_headers, sample_patient, revenue_cpt_code
    ):
        """Overdue CPT records do not contribute to revenue totals."""
        self._seed(
            sample_patient.patient_id,
            revenue_cpt_code.cpt_code_id,
            self.REPORT_DATE_OBJ,
            "overdue",
            400.00,
            40.00,
        )
        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        assert resp.get_json()["transaction_count"] == 0

    def test_cancelled_records_excluded(
        self, client, auth_headers, sample_patient, revenue_cpt_code
    ):
        """Cancelled CPT records do not contribute to revenue totals."""
        self._seed(
            sample_patient.patient_id,
            revenue_cpt_code.cpt_code_id,
            self.REPORT_DATE_OBJ,
            "cancelled",
            250.00,
            25.00,
        )
        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        assert resp.get_json()["transaction_count"] == 0

    def test_mixed_statuses_only_paid_counted(
        self, client, auth_headers, sample_patient, revenue_cpt_code
    ):
        """With a mix of statuses, only 'paid' records appear in the revenue total."""
        pid = sample_patient.patient_id
        cid = revenue_cpt_code.cpt_code_id
        self._seed(
            pid,
            cid,
            self.REPORT_DATE_OBJ,
            "paid",
            100.00,
            10.00,
            billing_date=self.REPORT_DATE_OBJ,
        )
        self._seed(pid, cid, self.REPORT_DATE_OBJ, "draft", 999.00, 99.00)
        self._seed(pid, cid, self.REPORT_DATE_OBJ, "submitted", 888.00, 88.00)
        self._seed(pid, cid, self.REPORT_DATE_OBJ, "overdue", 777.00, 77.00)
        self._seed(pid, cid, self.REPORT_DATE_OBJ, "cancelled", 666.00, 66.00)

        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        body = resp.get_json()
        assert body["transaction_count"] == 1
        assert body["data"]["subtotal"] == 110.00
        assert body["data"]["tax"] == 0.00
        assert body["data"]["total_revenue"] == 110.00

    # ---- Date isolation ----

    def test_records_from_other_dates_excluded(
        self, client, auth_headers, sample_patient, revenue_cpt_code
    ):
        """Paid records on a different date are not included in the report."""
        pid = sample_patient.patient_id
        cid = revenue_cpt_code.cpt_code_id
        self._seed(
            pid,
            cid,
            date(2026, 5, 11),
            "paid",
            999.00,
            99.00,
            billing_date=date(2026, 5, 11),
        )  # different date
        self._seed(
            pid,
            cid,
            self.REPORT_DATE_OBJ,
            "paid",
            100.00,
            10.00,
            billing_date=self.REPORT_DATE_OBJ,
        )  # target date

        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        body = resp.get_json()
        assert body["transaction_count"] == 1
        assert body["data"]["total_revenue"] == 110.00

    # ---- Empty / zero state ----

    def test_empty_day_returns_zero_totals(self, client, auth_headers):
        """A date with no CPT records returns zeros for all revenue fields."""
        resp = client.get(
            "/api/reports/daily-revenue?date=2000-01-01", headers=auth_headers
        )
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["transaction_count"] == 0
        assert body["data"]["subtotal"] == 0.0
        assert body["data"]["tax"] == 0.0
        assert body["data"]["total_revenue"] == 0.0

    # ---- Response structure ----

    def test_response_structure_always_present(self, client, auth_headers):
        """Response always includes date, transaction_count, and data with all sub-fields."""
        resp = client.get(
            "/api/reports/daily-revenue?date=2000-01-01", headers=auth_headers
        )
        body = resp.get_json()
        assert "date" in body
        assert "transaction_count" in body
        assert "data" in body
        for key in (
            "subtotal",
            "tax",
            "total_revenue",
            "procedure_subtotal",
            "procedure_tax",
            "procedure_total",
            "insurance_covered",
        ):
            assert key in body["data"], f"Missing key in data: '{key}'"

    def test_queried_date_echoed_in_response(self, client, auth_headers):
        """The response echoes back the exact date that was queried."""
        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}", headers=auth_headers
        )
        assert resp.get_json()["date"] == self.REPORT_DATE

    # ---- Authentication & authorisation ----

    def test_unauthenticated_request_returns_401(self, client):
        """No auth token returns 401."""
        resp = client.get(f"/api/reports/daily-revenue?date={self.REPORT_DATE}")
        assert resp.status_code == 401

    def test_doctor_cannot_access_revenue_report(self, client, doctor_auth_headers):
        """Doctor role is not authorised for revenue reports — returns 403."""
        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}",
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 403

    def test_nurse_cannot_access_revenue_report(self, client, nurse_auth_headers):
        """Nurse role is not authorised for revenue reports — returns 403."""
        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}",
            headers=nurse_auth_headers,
        )
        assert resp.status_code == 403

    def test_receptionist_cannot_access_revenue_report(
        self, client, receptionist_auth_headers
    ):
        """Receptionist role is not authorised for revenue reports — returns 403."""
        resp = client.get(
            f"/api/reports/daily-revenue?date={self.REPORT_DATE}",
            headers=receptionist_auth_headers,
        )
        assert resp.status_code == 403

    def test_missing_date_param_returns_400(self, client, auth_headers):
        """Omitting the date query parameter returns 400 with an error message."""
        resp = client.get("/api/reports/daily-revenue", headers=auth_headers)
        assert resp.status_code == 400
        assert "error" in resp.get_json()
