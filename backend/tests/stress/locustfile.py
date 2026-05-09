import random
from locust import HttpUser, task, between

class ClinicHubStressTest(HttpUser):
    # Mimics human delay between actions
    wait_time = between(1, 3)
    
    START_ID = 2
    END_ID = 10001
    ADMIN_EMAIL = "admin@clinic.com"
    ADMIN_PASS = "123"

    def on_start(self):
        """Logs in once and stores the token in headers."""
        self.headers = {"Content-Type": "application/json"}
        payload = {"email": self.ADMIN_EMAIL, "password": self.ADMIN_PASS}
        
        with self.client.post("/api/login", json=payload, catch_response=True) as res:
            if res.status_code == 200:
                token = res.json().get("access_token")
                self.headers["Authorization"] = f"Bearer {token}"
            else:
                res.failure("Initial login failed.")

    @task(4)
    def get_random_patient(self):
        """
        Groups all individual patient lookups into ONE row in Locust.
        """
        random_id = random.randint(self.START_ID, self.END_ID)
        
        # 'name' parameter prevents the dashboard from listing 10,000 separate IDs
        self.client.get(
            f"/api/patients/{random_id}", 
            headers=self.headers, 
            name="/api/patients/[id]"
        )

    @task(1)
    def browse_patient_list(self):
        """
        Groups all paginated list requests into ONE row in Locust.
        """
        random_page = random.randint(1, 20)
        
        self.client.get(
            f"/api/patients?page={random_page}&limit=50", 
            headers=self.headers,
            name="/api/patients?page=[page]"
        )