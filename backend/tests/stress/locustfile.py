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
        """Tests retrieval speed with 10,000+ records."""
        random_id = random.randint(self.START_ID, self.END_ID)
        self.client.get(
            f"/api/patients/{random_id}", 
            headers=self.headers, 
            name="/api/patients/[id]"
        )

    @task(3)
    def book_and_cancel_appointment(self):
        """Simulates 100 concurrent booking/cancellation requests."""
        patient_id = random.randint(self.START_ID, self.END_ID)
        rand_min = random.randint(10, 50)
        
        booking_data = {
            "patient_id": int(patient_id),
            "provider_user_id": int(self.DEFAULT_PROVIDER_ID),
            "scheduled_start": f"2026-06-01T11:{rand_min}:00",
            "scheduled_end": f"2026-06-01T11:{rand_min}:59",
            "reason": "Stress Test Appointment",
            "status": "scheduled"
        }
        
        with self.client.post("/api/appointments", json=booking_data, headers=self.headers, name="/api/appointments [POST]", catch_response=True) as res:
            if res.status_code == 201:
                appointment_id = res.json().get("id")
                if appointment_id:
                    time.sleep(0.1) 
                    self.client.delete(f"/api/appointments/{appointment_id}", headers=self.headers, name="/api/appointments/[id] [DELETE]")
            elif res.status_code == 409:
                res.success() 
            else:
                res.failure(f"Post failed {res.status_code}: {res.text}")

    @task(2)
    def browse_records(self):
        """Tests heavy query performance (pagination)."""
        page = random.randint(1, 20)
        self.client.get(
            f"/api/patients?page={page}&limit=50", 
            headers=self.headers,
            name="/api/patients?page=[page]"
        )

    # Report daily revenue

    @task(1)
    def get_revenue_report(self):
        """
        Tests the Daily Revenue Report aggregation.
        Target: < 3 seconds (we still monitor for < 2s to be safe).
        """
        # We target a specific date that likely has seeded data
        target_date = "2026-05-01" 
        
        self.client.get(
            f"/api/reports/daily-revenue?date={target_date}", 
            headers=self.headers, 
            name="/api/reports/daily-revenue"
        )


@events.request.add_listener
def validate_response_time(request_type, name, response_time, response_length, **kwargs):
    """Flags any request taking longer than 2000ms."""
    if response_time > 2000:
        print(f"PERFORMANCE ALERT: {name} took {response_time}ms")