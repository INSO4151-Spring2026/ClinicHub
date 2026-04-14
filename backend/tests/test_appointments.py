"""
Test suite for appointment scheduling endpoints.

Covers:
  - Authentication & RBAC (unauthenticated access, role restrictions)
  - POST   /api/appointments  – booking, validation, conflict detection
  - GET    /api/appointments  – listing with pagination and filters
  - GET    /api/appointments/:id – single retrieval
  - PUT    /api/appointments/:id – modification and rescheduling
  - DELETE /api/appointments/:id – soft-cancel
"""
import json
import pytest
from datetime import datetime, timezone, timedelta

# ---------------------------------------------------------------------------
# Shared test datetimes (all in UTC, well into the future)
# ---------------------------------------------------------------------------

BASE = datetime(2026, 6, 1, 9, 0, 0, tzinfo=timezone.utc)   # 09:00 UTC

START = BASE.isoformat()                                      # "2026-06-01T09:00:00+00:00"
END   = (BASE + timedelta(minutes=30)).isoformat()            # "2026-06-01T09:30:00+00:00"

# A slot that overlaps START–END
OVERLAP_START = (BASE + timedelta(minutes=15)).isoformat()
OVERLAP_END   = (BASE + timedelta(minutes=45)).isoformat()

# A slot immediately after START–END (no overlap)
ADJACENT_START = (BASE + timedelta(minutes=30)).isoformat()
ADJACENT_END   = (BASE + timedelta(hours=1)).isoformat()


# ===========================================================================
# Helpers
# ===========================================================================

def _book(client, headers, patient_id, provider_id, start=START, end=END, **extra):
    """POST /api/appointments with the minimum required payload."""
    payload = {
        "patient_id": patient_id,
        "provider_user_id": provider_id,
        "scheduled_start": start,
        "scheduled_end": end,
        **extra,
    }
    return client.post(
        "/api/appointments",
        data=json.dumps(payload),
        content_type="application/json",
        headers=headers,
    )


# ===========================================================================
# Authentication & RBAC
# ===========================================================================

class TestAppointmentAuth:
    """Endpoints must reject unauthenticated requests with 401."""

    def test_list_requires_auth(self, client):
        rv = client.get("/api/appointments")
        assert rv.status_code == 401

    def test_get_requires_auth(self, client):
        rv = client.get("/api/appointments/1")
        assert rv.status_code == 401

    def test_create_requires_auth(self, client):
        rv = client.post("/api/appointments", json={})
        assert rv.status_code == 401

    def test_update_requires_auth(self, client):
        rv = client.put("/api/appointments/1", json={})
        assert rv.status_code == 401

    def test_cancel_requires_auth(self, client):
        rv = client.delete("/api/appointments/1")
        assert rv.status_code == 401


class TestAppointmentRBAC:
    """Role-based access: nurses cannot cancel; all other roles cover remaining ops."""

    def test_nurse_cannot_cancel(self, client, sample_appointment, nurse_auth_headers):
        rv = client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=nurse_auth_headers,
        )
        assert rv.status_code == 403

    def test_receptionist_can_book(self, client, sample_patient, doctor_user, receptionist_auth_headers):
        rv = _book(client, receptionist_auth_headers, sample_patient.patient_id, doctor_user.user_id)
        assert rv.status_code == 201

    def test_receptionist_can_cancel(self, client, sample_appointment, receptionist_auth_headers):
        rv = client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=receptionist_auth_headers,
        )
        assert rv.status_code == 200

    def test_doctor_can_cancel(self, client, sample_appointment, doctor_auth_headers):
        rv = client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=doctor_auth_headers,
        )
        assert rv.status_code == 200

    def test_admin_can_cancel(self, client, sample_appointment, auth_headers):
        rv = client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        assert rv.status_code == 200


# ===========================================================================
# POST /api/appointments
# ===========================================================================

class TestCreateAppointment:

    def test_create_success(self, client, auth_headers, sample_patient, doctor_user):
        rv = _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id)
        assert rv.status_code == 201
        body = rv.get_json()
        assert "appointment" in body
        appt = body["appointment"]
        assert appt["patient_id"] == sample_patient.patient_id
        assert appt["provider_user_id"] == doctor_user.user_id
        assert appt["status"] == "scheduled"

    def test_create_returns_all_fields(self, client, auth_headers, sample_patient, doctor_user):
        rv = _book(
            client, auth_headers,
            sample_patient.patient_id, doctor_user.user_id,
            reason="Headache", notes="Patient reports 3 days of symptoms",
        )
        assert rv.status_code == 201
        appt = rv.get_json()["appointment"]
        for field in ("appointment_id", "patient_id", "provider_user_id",
                      "scheduled_start", "scheduled_end", "status",
                      "reason", "notes", "created_at", "updated_at"):
            assert field in appt

    def test_create_missing_patient_id(self, client, auth_headers, doctor_user):
        rv = client.post(
            "/api/appointments",
            json={"provider_user_id": doctor_user.user_id, "scheduled_start": START, "scheduled_end": END},
            headers=auth_headers,
        )
        assert rv.status_code == 400
        assert "patient_id" in rv.get_json()["error"]

    def test_create_missing_provider(self, client, auth_headers, sample_patient):
        rv = client.post(
            "/api/appointments",
            json={"patient_id": sample_patient.patient_id, "scheduled_start": START, "scheduled_end": END},
            headers=auth_headers,
        )
        assert rv.status_code == 400
        assert "provider_user_id" in rv.get_json()["error"]

    def test_create_missing_start(self, client, auth_headers, sample_patient, doctor_user):
        rv = client.post(
            "/api/appointments",
            json={"patient_id": sample_patient.patient_id, "provider_user_id": doctor_user.user_id, "scheduled_end": END},
            headers=auth_headers,
        )
        assert rv.status_code == 400

    def test_create_missing_end(self, client, auth_headers, sample_patient, doctor_user):
        rv = client.post(
            "/api/appointments",
            json={"patient_id": sample_patient.patient_id, "provider_user_id": doctor_user.user_id, "scheduled_start": START},
            headers=auth_headers,
        )
        assert rv.status_code == 400

    def test_create_end_before_start(self, client, auth_headers, sample_patient, doctor_user):
        rv = _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
                   start=END, end=START)
        assert rv.status_code == 400
        assert "scheduled_end" in rv.get_json()["error"]

    def test_create_end_equal_start(self, client, auth_headers, sample_patient, doctor_user):
        rv = _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
                   start=START, end=START)
        assert rv.status_code == 400

    def test_create_invalid_datetime_format(self, client, auth_headers, sample_patient, doctor_user):
        rv = _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
                   start="not-a-date", end=END)
        assert rv.status_code == 400

    def test_create_invalid_status(self, client, auth_headers, sample_patient, doctor_user):
        rv = _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
                   status="flying")
        assert rv.status_code == 400
        assert "status" in rv.get_json()["error"].lower()

    def test_create_nonexistent_patient(self, client, auth_headers, doctor_user):
        rv = _book(client, auth_headers, 99999, doctor_user.user_id)
        assert rv.status_code == 404
        assert "Patient" in rv.get_json()["error"]

    def test_create_nonexistent_provider(self, client, auth_headers, sample_patient):
        rv = _book(client, auth_headers, sample_patient.patient_id, 99999)
        assert rv.status_code == 404
        assert "Provider" in rv.get_json()["error"]

    # --- Conflict detection ------------------------------------------------

    def test_conflict_exact_overlap(self, client, auth_headers, sample_patient, doctor_user):
        """Booking the exact same slot twice must fail."""
        _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id)
        rv = _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id)
        assert rv.status_code == 409
        body = rv.get_json()
        assert "conflict_appointment_id" in body

    def test_conflict_partial_overlap(self, client, auth_headers, sample_patient, doctor_user):
        """An appointment whose window partially overlaps an existing one must fail."""
        _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id)
        rv = _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
                   start=OVERLAP_START, end=OVERLAP_END)
        assert rv.status_code == 409

    def test_no_conflict_adjacent_slot(self, client, auth_headers, sample_patient, doctor_user):
        """A slot starting exactly when the previous one ends is NOT a conflict."""
        _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id)
        rv = _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
                   start=ADJACENT_START, end=ADJACENT_END)
        assert rv.status_code == 201

    def test_no_conflict_different_provider(self, client, auth_headers, sample_patient, doctor_user, admin_user):
        """Two different providers can have overlapping slots without conflict."""
        _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id)
        rv = _book(client, auth_headers, sample_patient.patient_id, admin_user.user_id)
        assert rv.status_code == 201

    def test_cancelled_slot_can_be_rebooked(self, client, auth_headers, sample_patient, doctor_user,
                                             sample_appointment):
        """A cancelled appointment's slot should be available for rebooking."""
        # Cancel the existing appointment
        client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        # Same slot should now be free
        rv = _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id)
        assert rv.status_code == 201


# ===========================================================================
# GET /api/appointments (list)
# ===========================================================================

class TestListAppointments:

    def test_list_empty(self, client, auth_headers):
        rv = client.get("/api/appointments", headers=auth_headers)
        assert rv.status_code == 200
        body = rv.get_json()
        assert body["appointments"] == []
        assert body["pagination"]["total"] == 0

    def test_list_returns_created_appointment(self, client, auth_headers, sample_appointment):
        rv = client.get("/api/appointments", headers=auth_headers)
        assert rv.status_code == 200
        assert len(rv.get_json()["appointments"]) == 1

    def test_list_pagination_fields_present(self, client, auth_headers, sample_appointment):
        body = client.get("/api/appointments", headers=auth_headers).get_json()
        for key in ("total", "pages", "page", "per_page", "has_next", "has_prev"):
            assert key in body["pagination"]

    def test_list_filter_by_patient(self, client, auth_headers, sample_appointment):
        rv = client.get(
            f"/api/appointments?patient_id={sample_appointment.patient_id}",
            headers=auth_headers,
        )
        assert rv.status_code == 200
        assert all(
            a["patient_id"] == sample_appointment.patient_id
            for a in rv.get_json()["appointments"]
        )

    def test_list_filter_by_provider(self, client, auth_headers, sample_appointment):
        rv = client.get(
            f"/api/appointments?provider_user_id={sample_appointment.provider_user_id}",
            headers=auth_headers,
        )
        assert rv.status_code == 200
        assert all(
            a["provider_user_id"] == sample_appointment.provider_user_id
            for a in rv.get_json()["appointments"]
        )

    def test_list_filter_by_status(self, client, auth_headers, sample_appointment):
        rv = client.get("/api/appointments?status=scheduled", headers=auth_headers)
        assert rv.status_code == 200
        assert all(a["status"] == "scheduled" for a in rv.get_json()["appointments"])

    def test_list_invalid_status_filter(self, client, auth_headers):
        rv = client.get("/api/appointments?status=flying", headers=auth_headers)
        assert rv.status_code == 400

    def test_list_date_from_filter(self, client, auth_headers, sample_appointment):
        # date_from before the appointment → should appear
        rv = client.get("/api/appointments?date_from=2026-01-01T00:00:00", headers=auth_headers)
        assert rv.status_code == 200
        assert len(rv.get_json()["appointments"]) == 1

    def test_list_date_to_filter_excludes_appointment(self, client, auth_headers, sample_appointment):
        # date_to before the appointment's start → should be empty
        rv = client.get("/api/appointments?date_to=2026-01-01T00:00:00", headers=auth_headers)
        assert rv.status_code == 200
        assert len(rv.get_json()["appointments"]) == 0

    def test_list_per_page_capped_at_100(self, client, auth_headers):
        rv = client.get("/api/appointments?per_page=9999", headers=auth_headers)
        assert rv.status_code == 200
        assert rv.get_json()["pagination"]["per_page"] == 100

    def test_list_default_sort_ascending(self, client, auth_headers, sample_patient, doctor_user):
        # Create two appointments and check order
        _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
              start=START, end=END)
        _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
              start=ADJACENT_START, end=ADJACENT_END)
        rv = client.get("/api/appointments?sort_by=scheduled_start&order=asc", headers=auth_headers)
        items = rv.get_json()["appointments"]
        assert len(items) == 2
        assert items[0]["scheduled_start"] <= items[1]["scheduled_start"]

    def test_list_sort_descending(self, client, auth_headers, sample_patient, doctor_user):
        _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
              start=START, end=END)
        _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
              start=ADJACENT_START, end=ADJACENT_END)
        rv = client.get("/api/appointments?sort_by=scheduled_start&order=desc", headers=auth_headers)
        items = rv.get_json()["appointments"]
        assert items[0]["scheduled_start"] >= items[1]["scheduled_start"]


# ===========================================================================
# GET /api/appointments/:id
# ===========================================================================

class TestGetAppointment:

    def test_get_existing(self, client, auth_headers, sample_appointment):
        rv = client.get(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        assert rv.status_code == 200
        assert rv.get_json()["appointment_id"] == sample_appointment.appointment_id

    def test_get_nonexistent(self, client, auth_headers):
        rv = client.get("/api/appointments/99999", headers=auth_headers)
        assert rv.status_code == 404

    def test_get_all_fields_present(self, client, auth_headers, sample_appointment):
        body = client.get(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        ).get_json()
        for field in ("appointment_id", "patient_id", "provider_user_id",
                      "scheduled_start", "scheduled_end", "status",
                      "reason", "notes", "created_at", "updated_at"):
            assert field in body


# ===========================================================================
# PUT /api/appointments/:id
# ===========================================================================

class TestUpdateAppointment:

    def test_update_status(self, client, auth_headers, sample_appointment):
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"status": "confirmed"},
            headers=auth_headers,
        )
        assert rv.status_code == 200
        assert rv.get_json()["appointment"]["status"] == "confirmed"

    def test_update_reason_and_notes(self, client, auth_headers, sample_appointment):
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"reason": "Follow-up", "notes": "Bring prior labs"},
            headers=auth_headers,
        )
        assert rv.status_code == 200
        appt = rv.get_json()["appointment"]
        assert appt["reason"] == "Follow-up"
        assert appt["notes"] == "Bring prior labs"

    def test_update_reschedule_no_conflict(self, client, auth_headers, sample_appointment):
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"scheduled_start": ADJACENT_START, "scheduled_end": ADJACENT_END},
            headers=auth_headers,
        )
        assert rv.status_code == 200
        appt = rv.get_json()["appointment"]
        assert "09:30" in appt["scheduled_start"] or "09:30" in appt["scheduled_end"]

    def test_update_reschedule_conflict(self, client, auth_headers, sample_patient, doctor_user,
                                        sample_appointment):
        """Rescheduling into a slot occupied by another appointment must return 409."""
        # Create a second appointment in the adjacent slot
        _book(client, auth_headers, sample_patient.patient_id, doctor_user.user_id,
              start=ADJACENT_START, end=ADJACENT_END)

        # Try to reschedule sample_appointment into that occupied slot
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"scheduled_start": ADJACENT_START, "scheduled_end": ADJACENT_END},
            headers=auth_headers,
        )
        assert rv.status_code == 409

    def test_update_cancelled_cannot_reschedule(self, client, auth_headers, sample_appointment):
        """A cancelled appointment's time window cannot be changed."""
        client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"status": "cancelled"},
            headers=auth_headers,
        )
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"scheduled_start": ADJACENT_START, "scheduled_end": ADJACENT_END},
            headers=auth_headers,
        )
        assert rv.status_code == 409

    def test_update_completed_cannot_reschedule(self, client, auth_headers, sample_appointment):
        client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"status": "completed"},
            headers=auth_headers,
        )
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"scheduled_start": ADJACENT_START, "scheduled_end": ADJACENT_END},
            headers=auth_headers,
        )
        assert rv.status_code == 409

    def test_update_invalid_status(self, client, auth_headers, sample_appointment):
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"status": "unknown"},
            headers=auth_headers,
        )
        assert rv.status_code == 400

    def test_update_nonexistent(self, client, auth_headers):
        rv = client.put("/api/appointments/99999", json={"status": "confirmed"}, headers=auth_headers)
        assert rv.status_code == 404

    def test_update_end_before_start(self, client, auth_headers, sample_appointment):
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"scheduled_start": END, "scheduled_end": START},
            headers=auth_headers,
        )
        assert rv.status_code == 400

    def test_update_does_not_conflict_with_itself(self, client, auth_headers, sample_appointment):
        """Updating non-time fields on a scheduled appointment must not 409."""
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"reason": "Updated reason"},
            headers=auth_headers,
        )
        assert rv.status_code == 200

    def test_reschedule_does_not_conflict_with_itself(self, client, auth_headers, sample_appointment):
        """Re-submitting the same time window for the same appointment is idempotent."""
        rv = client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"scheduled_start": START, "scheduled_end": END},
            headers=auth_headers,
        )
        assert rv.status_code == 200


# ===========================================================================
# DELETE /api/appointments/:id  (soft cancel)
# ===========================================================================

class TestCancelAppointment:

    def test_cancel_sets_status_cancelled(self, client, auth_headers, sample_appointment):
        client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        rv = client.get(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        assert rv.get_json()["status"] == "cancelled"

    def test_cancel_returns_appointment_id(self, client, auth_headers, sample_appointment):
        rv = client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        assert rv.status_code == 200
        assert rv.get_json()["appointment_id"] == sample_appointment.appointment_id

    def test_cancel_nonexistent(self, client, auth_headers):
        rv = client.delete("/api/appointments/99999", headers=auth_headers)
        assert rv.status_code == 404

    def test_cancel_already_cancelled(self, client, auth_headers, sample_appointment):
        client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        rv = client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        assert rv.status_code == 409

    def test_cancel_completed_returns_409(self, client, auth_headers, sample_appointment):
        client.put(
            f"/api/appointments/{sample_appointment.appointment_id}",
            json={"status": "completed"},
            headers=auth_headers,
        )
        rv = client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        assert rv.status_code == 409

    def test_record_persists_after_cancel(self, client, auth_headers, sample_appointment):
        """Soft delete: the row must still be retrievable after cancellation."""
        client.delete(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        rv = client.get(
            f"/api/appointments/{sample_appointment.appointment_id}",
            headers=auth_headers,
        )
        assert rv.status_code == 200
