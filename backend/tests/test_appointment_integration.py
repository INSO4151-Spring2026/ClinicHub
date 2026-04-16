import pytest
import requests
import random
from datetime import datetime, timedelta

# The Gateway URL (Node.js)
BASE_URL = "http://localhost:5000"

@pytest.mark.integration
class TestAppointmentIntegration:
    """
    Integration tests for the Appointment lifecycle.
    Uses randomization to ensure tests pass even if the persistent 
    integration database wasn't fully cleared from a previous run.
    """

    def test_receptionist_can_book_appointment(self, receptionist_token):
        """
        Expects: 201 Created
        """
        headers = {"Authorization": f"Bearer {receptionist_token}"}
        
        # Random minute (1-59) ensures we don't hit the same slot as the last run
        rand_min = random.randint(1, 59)
        appt_date = (datetime.now() + timedelta(days=2, hours=9, minutes=rand_min)).isoformat()
        
        payload = {
            "patient_id": 1,
            "provider_user_id": 1,
            "appointment_date": appt_date,
            "reason": f"Routine Checkup {rand_min}",
            "notes": "Patient requested specific minute"
        }

        response = requests.post(f"{BASE_URL}/api/appointments", json=payload, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        assert "appointment_id" in data

    def test_appointment_conflict_logic(self, doctor_token):
        """
        Expects: 409 Conflict
        """
        headers = {"Authorization": f"Bearer {doctor_token}"}
        
        # Use a random hour to avoid previous run collisions
        rand_hour = random.randint(1, 23)
        conflict_time = (datetime.now() + timedelta(days=5, hours=rand_hour)).isoformat()
        
        payload = {
            "patient_id": 1,
            "provider_user_id": 1,
            "appointment_date": conflict_time,
            "reason": "Initial Booking"
        }

        # Step 1: Create the first appointment (Should pass)
        first_res = requests.post(f"{BASE_URL}/api/appointments", json=payload, headers=headers)
        assert first_res.status_code == 201

        # Step 2: Try to book the exact same time/provider (Should conflict)
        second_res = requests.post(f"{BASE_URL}/api/appointments", json=payload, headers=headers)
        
        assert second_res.status_code == 409
        assert "already booked" in second_res.json()["error"]

    def test_doctor_can_view_all_appointments(self, doctor_token):
        """
        Expects: 200 OK
        """
        headers = {"Authorization": f"Bearer {doctor_token}"}
        response = requests.get(f"{BASE_URL}/api/appointments", headers=headers)
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_delete_appointment_persistence(self, admin_token):
        """
        Expects: 200 OK -> 404 Not Found
        """
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Randomize day to stay clear of other tests
        rand_day = random.randint(10, 20)
        payload = {
            "patient_id": 1, 
            "provider_user_id": 1,
            "appointment_date": (datetime.now() + timedelta(days=rand_day)).isoformat(),
            "reason": "Temporary Appt"
        }
        
        # 1. Create
        create_res = requests.post(f"{BASE_URL}/api/appointments", json=payload, headers=headers)
        assert create_res.status_code == 201
        appt_id = create_res.json()["appointment_id"]

        # 2. Delete
        del_res = requests.delete(f"{BASE_URL}/api/appointments/{appt_id}", headers=headers)
        assert del_res.status_code == 200

        # 3. Verify 404
        verify_res = requests.delete(f"{BASE_URL}/api/appointments/{appt_id}", headers=headers)
        assert verify_res.status_code == 404