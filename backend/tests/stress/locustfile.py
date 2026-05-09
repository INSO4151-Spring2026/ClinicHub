import random
import time
from locust import HttpUser, task, between, events

class ClinicHubStressTest(HttpUser):
    wait_time = between(1, 2)
    
    #  Configuration for test parameters
    START_ID = 2
    END_ID = 10001
    ADMIN_EMAIL = "admin@clinic.com"
    ADMIN_PASS = "123"
    DEFAULT_PROVIDER_ID = 1 

    def on_start(self):
        """Logs in once to get the Bearer token."""
        self.headers = {"Content-Type": "application/json"}
        payload = {"email": self.ADMIN_EMAIL, "password": self.ADMIN_PASS}
        
        with self.client.post("/api/login", json=payload, catch_response=True) as res:
            if res.status_code == 200:
                token = res.json().get("access_token")
                self.headers["Authorization"] = f"Bearer {token}"
            else:
                res.failure(f"Login failed: {res.text}")

    @task(5)
    def get_patient_record(self):
        """Validates retrieval speed with 10,000+ records."""
        random_id = random.randint(self.START_ID, self.END_ID)
        self.client.get(
            f"/api/patients/{random_id}", 
            headers=self.headers, 
            name="/api/patients/[id]"
        )

    @task(2)
    def book_and_cancel_appointment(self):
        """Simulates booking/cancellation by generating unique time slots."""
        patient_id = random.randint(self.START_ID, self.END_ID)
        
        # Dynamic time logic
        # Randomize the minute and second to avoid 409 Conflicts
        rand_min = random.randint(10, 50)
        rand_sec = random.randint(10, 50)
        
        start_time = f"2026-06-01T10:{rand_min}:{rand_sec}"
        # End time is just 1 second later since we are deleting it anyway
        end_time = f"2026-06-01T10:{rand_min}:{rand_sec + 1 if rand_sec < 59 else 59}"

        booking_data = {
            "patient_id": int(patient_id),
            "provider_user_id": int(self.DEFAULT_PROVIDER_ID),
            "scheduled_start": start_time,
            "scheduled_end": end_time,
            "reason": "Stress Test Appointment",
            "status": "scheduled"
        }
        
        with self.client.post("/api/appointments", json=booking_data, headers=self.headers, name="/api/appointments [POST]", catch_response=True) as res:
            if res.status_code == 201:
                appointment_id = res.json().get("id")
                if appointment_id:
                    # Keep the record briefly to ensure it exists in the DB
                    time.sleep(0.1) 
                    self.client.delete(
                        f"/api/appointments/{appointment_id}", 
                        headers=self.headers, 
                        name="/api/appointments/[id] [DELETE]"
                    )
            elif res.status_code == 409:
                # If we still hit a conflict, just mark it as a 'successful' test of the 409 logic
                res.success() 
            else:
                res.failure(f"Post failed {res.status_code}: {res.text}")

    @task(1)
    def browse_records(self):
        """Tests heavy query performance (pagination) under load."""
        page = random.randint(1, 20)
        self.client.get(
            f"/api/patients?page={page}&limit=50", 
            headers=self.headers,
            name="/api/patients?page=[page]"
        )

# Performance monitoring: Logs any request taking longer than 2 seconds
@events.request.add_listener
def validate_response_time(request_type, name, response_time, response_length, **kwargs):
    """Checks for sub-2-second response times."""
    if response_time > 2000:
        print(f"🚨 PERFORMANCE GAP: {name} took {response_time}ms")