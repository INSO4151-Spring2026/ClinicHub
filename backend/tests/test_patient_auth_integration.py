import pytest
import requests

BASE_URL = "http://localhost:5000"

@pytest.fixture
def doctor_token():
    """Logs in as a doctor and returns the JWT."""
    payload = {"email": "doctor@clinic.com", "password": "123"}
    response = requests.post(f"{BASE_URL}/api/login", json=payload)
    return response.json().get("access_token")

def test_doctor_can_create_patient(doctor_token):
    headers = {"Authorization": f"Bearer {doctor_token}"}
    patient_data = {
        "first_name": "John",
        "last_name": "Doe",
        "dob": "1990-01-01",
        "gender": "Male"
    }
    
    # Act: Attempt to create a patient
    response = requests.post(f"{BASE_URL}/api/patients", json=patient_data, headers=headers)
    
    # Assert: Should be 201 Created
    assert response.status_code == 201
    assert response.json()["message"] == "Patient created successfully"

def test_unauthorized_access_denied():
    # Act: Attempt to fetch patients WITHOUT a token
    response = requests.get(f"{BASE_URL}/api/patients")
    
    # Assert: Should be 401 Unauthorized
    assert response.status_code == 401