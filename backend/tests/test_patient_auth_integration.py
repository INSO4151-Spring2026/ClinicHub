import pytest
import requests
import os

# The Gateway URL (Node.js)
BASE_URL = "http://localhost:5000"

@pytest.mark.integration
class TestPatientAuthIntegration:
    """
    Integration tests for Patient authentication and authorization.
    Requires Node.js Gateway and Flask Backend (in Testing mode) to be running.
    """

    @pytest.fixture(autouse=True)
    def setup_tokens(self, app):
        """
        This fixture ensures the 'app' fixture from conftest.py runs first,
        which creates the physical 'test_integration.db' and seeds roles.
        """
        pass

    def test_doctor_can_create_patient(self, doctor_token):
        """
        Test: A user with 'doctor' role can create a patient record.
        Expects: 201 Created
        """
        headers = {"Authorization": f"Bearer {doctor_token}"}
        patient_data = {
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1990-01-01",
            "sex": "male", # Match your DB model column names
            "email": "john.doe@example.com",
            "phone": "555-0199"
        }
        
        # Note: Ensure the trailing slash matches your Flask route definition
        response = requests.post(f"{BASE_URL}/api/patients", json=patient_data, headers=headers)
        
        # If this returns 404, check if the Node Gateway forwards /api/patients
        # If this returns 401, check if Flask is running with FLASK_ENV=testing
        assert response.status_code == 201
        assert "patient_id" in response.json()

    def test_unauthorized_access_denied(self):
        """
        Test: Accessing the patients list without a token should be blocked.
        Expects: 401 Unauthorized
        """
        # Act: Attempt to fetch patients WITHOUT a token
        response = requests.get(f"{BASE_URL}/api/patients")
        
        # Assert: The decorator should catch this and return 401
        assert response.status_code == 401

    def test_receptionist_can_view_patients(self, receptionist_token):
        """
        Test: A receptionist should be able to view the patient list.
        Expects: 200 OK
        """
        headers = {"Authorization": f"Bearer {receptionist_token}"}
        response = requests.get(f"{BASE_URL}/api/patients", headers=headers)
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)