import pytest
import requests
import random
import time
from datetime import datetime, timedelta

# The Gateway URL (Node.js)
BASE_URL = "http://localhost:5000"

@pytest.mark.integration
class TestAppointmentIntegration:
    """
    Integration tests for Appointment booking and management.
    Handles persistent DB conflicts by using dynamic time offsets.
    """

    @pytest.fixture(autouse=True)
    def setup_tokens(self, app):
        """Ensures the app and DB are initialized."""
        pass

    def test_receptionist_can_book_appointment(self, receptionist_token):
        """
        Expects: 201 Created
        """
        headers = {"Authorization": f"Bearer {receptionist_token}"}
    
        # Defined unique_id to avoid NameError
        unique_id = int(time.time())
        days_ahead = random.randint(10, 100)
        rand_min = random.randint(0, 59)
        
        future_date = datetime.now() + timedelta(days=days_ahead, hours=10, minutes=rand_min)
        appt_date_str = future_date.strftime("%Y-%m-%dT%H:%M:%S")
    
        payload = {
            "patient_id": 1,
            "provider_user_id": 1,
            "appointment_date": appt_date_str,
            "reason": f"Integration Test Checkup {unique_id}",
            "notes": "Testing conflict avoidance logic"
        }
    
        response = requests.post(f"{BASE_URL}/api/appointments", json=payload, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        
        # Flexible check for nested or flat response
        appt_obj = data.get("appointment", data) if isinstance(data, dict) else data
        assert "appointment_id" in appt_obj or "id" in appt_obj

    def test_appointment_conflict_logic(self, receptionist_token):
        """
        Test: Booking the exact same slot twice should return 409.
        """
        headers = {"Authorization": f"Bearer {receptionist_token}"}
        unique_time = (datetime.now() + timedelta(days=200)).strftime("%Y-%m-%dT%H:%M:%S")
        
        payload = {
            "patient_id": 1,
            "provider_user_id": 1,
            "appointment_date": unique_time,
            "reason": "Initial booking"
        }

        # First booking
        requests.post(f"{BASE_URL}/api/appointments", json=payload, headers=headers)
        
        # Duplicate booking
        response = requests.post(f"{BASE_URL}/api/appointments", json=payload, headers=headers)
        assert response.status_code == 409

    def test_doctor_can_view_all_appointments(self, doctor_token):
        """
        Expects: 200 OK
        """
        headers = {"Authorization": f"Bearer {doctor_token}"}
        response = requests.get(f"{BASE_URL}/api/appointments", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
    
        # We check if it's a list; if it's a dict, we try to get "appointments".
        if isinstance(data, list):
            appointments = data
        else:
            appointments = data.get("appointments", [])

        assert isinstance(appointments, list)

    def test_delete_appointment_persistence(self, receptionist_token):
        """
        Test: Create then delete an appointment.
        """
        headers = {"Authorization": f"Bearer {receptionist_token}"}
        
        # Create with unique time to ensure we have one to delete
        unique_time = (datetime.now() + timedelta(days=120)).strftime("%Y-%m-%dT%H:%M:%S")
        payload = {
            "patient_id": 1, 
            "provider_user_id": 1, 
            "appointment_date": unique_time, 
            "reason": "Delete Test"
        }
        
        create_res = requests.post(f"{BASE_URL}/api/appointments", json=payload, headers=headers)
        assert create_res.status_code == 201
        
        data = create_res.json()
        appt_obj = data.get("appointment", data) if isinstance(data, dict) else data
        appt_id = appt_obj.get("appointment_id") or appt_obj.get("id")

        # Delete
        del_res = requests.delete(f"{BASE_URL}/api/appointments/{appt_id}", headers=headers)
        assert del_res.status_code in [200, 204]