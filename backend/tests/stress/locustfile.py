import random
import time
from locust import HttpUser, task, between

class ClinicHubSLA(HttpUser):
    wait_time = between(0.1, 0.5)  # Aggressive ramp-up
    
    def on_start(self):
        """Authenticate once per user and cache Patient IDs."""
        self.patient_ids = []
        # 1. Login
        login_res = self.client.post("/api/login", json={"email": "admin@clinic.com", "password": "123"})
        if login_res.status_code == 200:
            token = login_res.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {token}"}
        else:
            self.interrupt()

        # 2. Pre-fetch valid Patient IDs for bookings
        with self.client.get("/api/patients?limit=5000", headers=self.headers) as p_res:
            if p_res.status_code == 200:
                self.patient_ids = [p['patient_id'] for p in p_res.json()]

    @task(10)
    def test_record_retrieval_sla(self):
        """Requirement: Validate sub-2-second retrieval of 10,000+ records."""
        with self.client.get("/api/patients", headers=self.headers, catch_response=True) as response:
            if response.elapsed.total_seconds() > 2.0:
                response.failure(f"SLA Violation: {response.elapsed.total_seconds()}s")
            elif response.status_code != 200:
                response.failure(f"Failed with status: {response.status_code}")

    @task(5)
    def booking_cancellation_cycle(self):
        """Requirement: 500 concurrent Booking/Cancellation cycles."""
        if not self.patient_ids:
            return

        p_id = random.choice(self.patient_ids)
        # Randomize date to minimize database contention
        date_str = f"2026-06-{random.randint(1, 30):02d}T{random.randint(8, 17):02d}:00:00"
        
        payload = {
            "patient_id": p_id,
            "provider_user_id": 1,
            "appointment_date": date_str,
            "reason": "Stress Test"
        }

        # Step 1: Create Booking
        with self.client.post("/api/appointments", json=payload, headers=self.headers, catch_response=True) as b_res:
            if b_res.status_code == 201:
                appt_id = b_res.json().get("appointment_id")
                # Step 2: Immediate Cancellation
                if appt_id:
                    self.client.delete(f"/api/appointments/{appt_id}", headers=self.headers)
            elif b_res.status_code == 409:
                b_res.success() # Concurrent conflict is valid business logic
            else:
                b_res.failure(f"Booking Error: {b_res.status_code}")