"""
RBAC (Role-Based Access Control) tests.

Current state: Patient routes do NOT enforce authentication or role checks.
Tests marked with @pytest.mark.xfail document the EXPECTED behavior once
RBAC middleware is added to the patient routes.

When you add role enforcement to the routes, remove the xfail markers and
ensure those tests pass.
"""
import pytest
from app.utils.jwt_handler import generate_access_token


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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
# Current behavior: unauthenticated requests reach patient endpoints
# ---------------------------------------------------------------------------

class TestCurrentUnauthenticatedAccess:
    """
    These tests document the CURRENT behavior where patient routes require
    no authentication. They should all pass right now.
    """

    def test_create_patient_no_auth_currently_allowed(self, client):
        res = client.post("/api/patients", json=PATIENT_PAYLOAD)
        # Currently 201 because there is no auth guard
        assert res.status_code == 201

    def test_get_patient_no_auth_currently_allowed(self, client, sample_patient):
        res = client.get(f"/api/patients/{sample_patient.patient_id}")
        assert res.status_code == 200

    def test_list_patients_no_auth_currently_allowed(self, client):
        res = client.get("/api/patients")
        assert res.status_code == 200

    def test_update_patient_no_auth_currently_allowed(self, client, sample_patient):
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"first_name": "Updated"},
        )
        assert res.status_code == 200

    def test_delete_patient_no_auth_currently_allowed(self, client, sample_patient):
        res = client.delete(f"/api/patients/{sample_patient.patient_id}")
        assert res.status_code == 200


# ---------------------------------------------------------------------------
# Future behavior: once RBAC is enforced on patient routes
# ---------------------------------------------------------------------------

class TestRBACEnforcement:
    """
    These tests describe the EXPECTED behavior after RBAC is implemented.
    All are marked xfail because auth guards don't exist yet.

    To implement RBAC:
      1. Add a `require_auth` decorator that validates the Bearer token.
      2. Add a `require_role(*roles)` decorator that checks the user's role.
      3. Apply them to the patient routes.
    """

    @pytest.mark.xfail(reason="Auth not yet enforced on patient routes", strict=True)
    def test_unauthenticated_request_is_rejected(self, client):
        res = client.get("/api/patients")
        assert res.status_code == 401

    @pytest.mark.xfail(reason="Auth not yet enforced on patient routes", strict=True)
    def test_create_patient_requires_auth(self, client):
        res = client.post("/api/patients", json=PATIENT_PAYLOAD)
        assert res.status_code == 401

    @pytest.mark.xfail(reason="Auth not yet enforced on patient routes", strict=True)
    def test_delete_patient_requires_auth(self, client, sample_patient):
        res = client.delete(f"/api/patients/{sample_patient.patient_id}")
        assert res.status_code == 401


class TestRBACWithValidTokens:
    """
    Tests for role-specific access once RBAC is enforced.
    All xfail until enforcement is added.
    """

    @pytest.mark.xfail(reason="Role enforcement not yet implemented", strict=False)
    def test_admin_can_delete_patient(self, client, admin_user, sample_patient):
        token = generate_access_token(admin_user.user_id)
        res = client.delete(
            f"/api/patients/{sample_patient.patient_id}",
            headers=_headers(token),
        )
        assert res.status_code == 200

    @pytest.mark.xfail(reason="Role enforcement not yet implemented", strict=True)
    def test_receptionist_cannot_delete_patient(self, client, receptionist_user, sample_patient):
        token = generate_access_token(receptionist_user.user_id)
        res = client.delete(
            f"/api/patients/{sample_patient.patient_id}",
            headers=_headers(token),
        )
        assert res.status_code == 403

    @pytest.mark.xfail(reason="Role enforcement not yet implemented", strict=False)
    def test_doctor_can_read_patient(self, client, doctor_user, sample_patient):
        token = generate_access_token(doctor_user.user_id)
        res = client.get(
            f"/api/patients/{sample_patient.patient_id}",
            headers=_headers(token),
        )
        assert res.status_code == 200

    @pytest.mark.xfail(reason="Role enforcement not yet implemented", strict=False)
    def test_nurse_can_create_patient(self, client, nurse_user):
        token = generate_access_token(nurse_user.user_id)
        res = client.post(
            "/api/patients",
            json=PATIENT_PAYLOAD,
            headers=_headers(token),
        )
        assert res.status_code == 201

    @pytest.mark.xfail(reason="Role enforcement not yet implemented", strict=True)
    def test_invalid_token_is_rejected(self, client, sample_patient):
        res = client.get(
            f"/api/patients/{sample_patient.patient_id}",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert res.status_code == 403
