"""
Tests for the medical records endpoints.

Covers:
  - POST /api/medical-records  (create record)
  - GET  /api/medical-records/<id>  (get single record)
  - GET  /api/medical-records?patient_id=X  (list records for patient)
  - PUT  /api/medical-records/<id>  (update record)
"""
import pytest
from app import db
from app.models.medical_record import MedicalRecord


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_record(app, sample_patient, doctor_user):
    """A single persisted medical record."""
    record = MedicalRecord(
        patient_id=sample_patient.patient_id,
        provider_user_id=doctor_user.user_id,
        diagnosis="Hypertension",
        treatment_plan="Lifestyle modification and medication",
        notes="Follow up in 4 weeks",
    )
    db.session.add(record)
    db.session.commit()
    return record


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestCreateMedicalRecord:

    def test_doctor_can_create_record(self, client, doctor_auth_headers, sample_patient):
        resp = client.post(
            "/api/medical-records",
            json={
                "patient_id": sample_patient.patient_id,
                "diagnosis": "Type 2 Diabetes",
                "treatment_plan": "Metformin 500mg twice daily",
                "notes": "Patient counseled on diet",
            },
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["message"] == "Medical record created successfully"
        assert data["record"]["diagnosis"] == "Type 2 Diabetes"
        assert data["record"]["treatment_plan"] == "Metformin 500mg twice daily"
        assert data["record"]["patient_id"] == sample_patient.patient_id

    def test_receptionist_cannot_create_record(self, client, receptionist_auth_headers, sample_patient):
        resp = client.post(
            "/api/medical-records",
            json={
                "patient_id": sample_patient.patient_id,
                "diagnosis": "Flu",
                "treatment_plan": "Rest and fluids",
            },
            headers=receptionist_auth_headers,
        )
        assert resp.status_code == 403

    def test_create_record_missing_patient_id(self, client, doctor_auth_headers):
        resp = client.post(
            "/api/medical-records",
            json={
                "diagnosis": "Flu",
                "treatment_plan": "Rest and fluids",
            },
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 400
        assert "patient_id" in resp.get_json()["error"]

    def test_create_record_missing_diagnosis(self, client, doctor_auth_headers, sample_patient):
        resp = client.post(
            "/api/medical-records",
            json={
                "patient_id": sample_patient.patient_id,
                "treatment_plan": "Rest and fluids",
            },
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 400
        assert "diagnosis" in resp.get_json()["error"]

    def test_create_record_unknown_patient(self, client, doctor_auth_headers):
        resp = client.post(
            "/api/medical-records",
            json={
                "patient_id": 99999,
                "diagnosis": "Flu",
                "treatment_plan": "Rest and fluids",
            },
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 404


class TestGetMedicalRecord:

    def test_get_record_by_id(self, client, doctor_auth_headers, sample_record):
        resp = client.get(
            f"/api/medical-records/{sample_record.medical_record_id}",
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["record"]["medical_record_id"] == sample_record.medical_record_id
        assert data["record"]["diagnosis"] == "Hypertension"

    def test_get_nonexistent_record_returns_404(self, client, doctor_auth_headers):
        resp = client.get(
            "/api/medical-records/99999",
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 404
        assert "not found" in resp.get_json()["error"].lower()

    def test_receptionist_can_get_record(self, client, receptionist_auth_headers, sample_record):
        resp = client.get(
            f"/api/medical-records/{sample_record.medical_record_id}",
            headers=receptionist_auth_headers,
        )
        assert resp.status_code == 200


class TestListMedicalRecords:

    def test_list_records_for_patient(self, client, doctor_auth_headers, sample_patient, sample_record):
        resp = client.get(
            f"/api/medical-records?patient_id={sample_patient.patient_id}",
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 200
        records = resp.get_json()
        assert isinstance(records, list)
        assert len(records) >= 1
        assert records[0]["patient_id"] == sample_patient.patient_id

    def test_list_records_ordered_by_date_descending(self, client, doctor_auth_headers, sample_patient, doctor_user):
        r1 = MedicalRecord(
            patient_id=sample_patient.patient_id,
            provider_user_id=doctor_user.user_id,
            diagnosis="Visit A",
            treatment_plan="Plan A",
        )
        r2 = MedicalRecord(
            patient_id=sample_patient.patient_id,
            provider_user_id=doctor_user.user_id,
            diagnosis="Visit B",
            treatment_plan="Plan B",
        )
        db.session.add_all([r1, r2])
        db.session.commit()

        resp = client.get(
            f"/api/medical-records?patient_id={sample_patient.patient_id}",
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 200
        records = resp.get_json()
        assert len(records) >= 2

    def test_list_records_missing_patient_id(self, client, doctor_auth_headers):
        resp = client.get("/api/medical-records", headers=doctor_auth_headers)
        assert resp.status_code == 400

    def test_list_records_empty_for_unknown_patient(self, client, doctor_auth_headers):
        resp = client.get(
            "/api/medical-records?patient_id=99999",
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 200
        assert resp.get_json() == []


class TestUpdateMedicalRecord:

    def test_doctor_can_update_record(self, client, doctor_auth_headers, sample_record):
        resp = client.put(
            f"/api/medical-records/{sample_record.medical_record_id}",
            json={"diagnosis": "Hypertension Stage 2", "notes": "Updated notes"},
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["record"]["diagnosis"] == "Hypertension Stage 2"
        assert data["record"]["notes"] == "Updated notes"

    def test_receptionist_cannot_update_record(self, client, receptionist_auth_headers, sample_record):
        resp = client.put(
            f"/api/medical-records/{sample_record.medical_record_id}",
            json={"diagnosis": "Changed"},
            headers=receptionist_auth_headers,
        )
        assert resp.status_code == 403

    def test_update_nonexistent_record_returns_404(self, client, doctor_auth_headers):
        resp = client.put(
            "/api/medical-records/99999",
            json={"diagnosis": "Updated"},
            headers=doctor_auth_headers,
        )
        assert resp.status_code == 404
