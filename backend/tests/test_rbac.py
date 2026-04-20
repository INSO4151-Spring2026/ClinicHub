"""
RBAC (Role-Based Access Control) tests.

Permissions enforced on patient routes:
  GET    (list, detail) : admin, doctor, nurse, receptionist
  POST   (create)       : admin, doctor, nurse, receptionist
  PUT    (update)       : admin, doctor, nurse
  DELETE                : admin only
"""
import pytest
from app.utils.jwt_handler import generate_access_token


PATIENT_PAYLOAD = {
    "first_name": "Test",
    "last_name": "Patient",
    "dob": "1985-03-20",
    "sex": "male",
    "email": "test.patient@rbac.com",
}


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Unauthenticated requests are rejected
# ---------------------------------------------------------------------------

class TestUnauthenticatedAccess:
    def test_list_patients_requires_auth(self, client):
        res = client.get("/api/patients")
        assert res.status_code == 401

    def test_get_patient_requires_auth(self, client, sample_patient):
        res = client.get(f"/api/patients/{sample_patient.patient_id}")
        assert res.status_code == 401

    def test_create_patient_requires_auth(self, client):
        res = client.post("/api/patients", json=PATIENT_PAYLOAD)
        assert res.status_code == 401

    def test_update_patient_requires_auth(self, client, sample_patient):
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"first_name": "Hacker"},
        )
        assert res.status_code == 401

    def test_delete_patient_requires_auth(self, client, sample_patient):
        res = client.delete(f"/api/patients/{sample_patient.patient_id}")
        assert res.status_code == 401

    def test_invalid_token_is_rejected(self, client, sample_patient):
        res = client.get(
            f"/api/patients/{sample_patient.patient_id}",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Role-specific access
# ---------------------------------------------------------------------------

class TestRolePermissions:
    # --- Admin: full access ---

    def test_admin_can_list_patients(self, client, admin_user, sample_patient):
        token = generate_access_token(admin_user)
        res = client.get("/api/patients", headers=_headers(token))
        assert res.status_code == 200

    def test_admin_can_create_patient(self, client, admin_user):
        token = generate_access_token(admin_user)
        res = client.post("/api/patients", json=PATIENT_PAYLOAD, headers=_headers(token))
        assert res.status_code == 201

    def test_admin_can_update_patient(self, client, admin_user, sample_patient):
        token = generate_access_token(admin_user)
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"first_name": "Updated"},
            headers=_headers(token),
        )
        assert res.status_code == 200

    def test_admin_can_delete_patient(self, client, admin_user, sample_patient):
        token = generate_access_token(admin_user)
        res = client.delete(
            f"/api/patients/{sample_patient.patient_id}",
            headers=_headers(token),
        )
        assert res.status_code == 200

    # --- Doctor: can read, create, update — cannot delete ---

    def test_doctor_can_read_patient(self, client, doctor_user, sample_patient):
        token = generate_access_token(doctor_user)
        res = client.get(
            f"/api/patients/{sample_patient.patient_id}",
            headers=_headers(token),
        )
        assert res.status_code == 200

    def test_doctor_can_create_patient(self, client, doctor_user):
        token = generate_access_token(doctor_user)
        res = client.post("/api/patients",
                          json={**PATIENT_PAYLOAD, "email": "doc.patient@test.com"},
                          headers=_headers(token))
        assert res.status_code == 201

    def test_doctor_can_update_patient(self, client, doctor_user, sample_patient):
        token = generate_access_token(doctor_user)
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"phone": "555-9999"},
            headers=_headers(token),
        )
        assert res.status_code == 200

    def test_doctor_cannot_delete_patient(self, client, doctor_user, sample_patient):
        token = generate_access_token(doctor_user)
        res = client.delete(
            f"/api/patients/{sample_patient.patient_id}",
            headers=_headers(token),
        )
        assert res.status_code == 403

    # --- Nurse: can read, create, update — cannot delete ---

    def test_nurse_can_create_patient(self, client, nurse_user):
        token = generate_access_token(nurse_user)
        res = client.post("/api/patients",
                          json={**PATIENT_PAYLOAD, "email": "nurse.patient@test.com"},
                          headers=_headers(token))
        assert res.status_code == 201

    def test_nurse_can_update_patient(self, client, nurse_user, sample_patient):
        token = generate_access_token(nurse_user)
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"address": "789 New St"},
            headers=_headers(token),
        )
        assert res.status_code == 200

    def test_nurse_cannot_delete_patient(self, client, nurse_user, sample_patient):
        token = generate_access_token(nurse_user)
        res = client.delete(
            f"/api/patients/{sample_patient.patient_id}",
            headers=_headers(token),
        )
        assert res.status_code == 403

    # --- Receptionist: can read and create — cannot update or delete ---

    def test_receptionist_can_list_patients(self, client, receptionist_user, sample_patient):
        token = generate_access_token(receptionist_user)
        res = client.get("/api/patients", headers=_headers(token))
        assert res.status_code == 200

    def test_receptionist_can_create_patient(self, client, receptionist_user):
        token = generate_access_token(receptionist_user)
        res = client.post("/api/patients",
                          json={**PATIENT_PAYLOAD, "email": "rec.patient@test.com"},
                          headers=_headers(token))
        assert res.status_code == 201

    def test_receptionist_cannot_update_patient(self, client, receptionist_user, sample_patient):
        token = generate_access_token(receptionist_user)
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"first_name": "Hacker"},
            headers=_headers(token),
        )
        assert res.status_code == 403

    def test_receptionist_cannot_delete_patient(self, client, receptionist_user, sample_patient):
        token = generate_access_token(receptionist_user)
        res = client.delete(
            f"/api/patients/{sample_patient.patient_id}",
            headers=_headers(token),
        )
        assert res.status_code == 403