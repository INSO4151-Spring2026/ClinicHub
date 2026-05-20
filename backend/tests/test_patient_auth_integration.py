import pytest

# The Gateway URL (Node.js)
BASE_URL = "http://localhost:5000"

@pytest.mark.integration
class TestPatientAuthIntegration:
    """
    Integration tests for Patient Authentication and Authorization management.
    """

    @pytest.fixture(autouse=True)
    def setup_tokens(self, app):
        """Ensures the app and DB are initialized."""
        pass

    def test_doctor_can_create_patient(self, client, doctor_token):
        """
        Expects: 201 Created or 200 OK depending on configuration
        """
        headers = {"Authorization": f"Bearer {doctor_token}"}
        
        payload = {
            "first_name": "Test",
            "last_name": "Patient",
            "dob": "1995-01-01",
            "sex": "male",
            "email": "test.patient_auth@test.com",
            "phone": "555-0199",
            "address": "456 Test Ave, Anytown, USA",
            "emergency_contact_name": "Mary Patient",
            "emergency_contact_phone": "555-0198"
        }

        response = client.post("/api/patients", json=payload, headers=headers)
        assert response.status_code in [200, 201]

    def test_unauthorized_access_denied(self, client):
        """
        Expects: 401 Unauthorized
        """
        response = client.get("/api/patients")
        assert response.status_code == 401

    def test_receptionist_can_view_patients(self, client, receptionist_token):
        """
        Test: A receptionist should be able to view the patient list.
        Expects: 200 OK
        """
        headers = {"Authorization": f"Bearer {receptionist_token}"}
        response = client.get("/api/patients", headers=headers)
    
        assert response.status_code == 200
        data = response.get_json()
    

        if isinstance(data, list):
            patients_list = data
        else:
            patients_list = data.get("patients", [])

        assert isinstance(patients_list, list)