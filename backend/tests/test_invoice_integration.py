import pytest
import requests
import random
from datetime import datetime, timedelta

# Gateway URL
BASE_URL = "http://localhost:5000"

@pytest.mark.integration
class TestBillingIntegration:
    """
    Integration tests for ClinicHub Invoice system.
    """

    def test_receptionist_can_create_invoice(self, receptionist_token):
        """
        Test: Create an appointment, then generate an invoice for it.
        Expects: 201 Created
        """
        headers = {"Authorization": f"Bearer {receptionist_token}"}
    
        # Create a fresh appointment with a RANDOM date to avoid 409 Conflict
        days_ahead = random.randint(200, 500)
        unique_time = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%dT%H:%M:%S")
    
        appt_payload = {
            "patient_id": 1,
            "provider_user_id": 1,
            "appointment_date": unique_time,
            "reason": "Billing Integration Test"
        }
    
        # Make the request FIRST so the variable 'appt_res' exists
        appt_res = requests.post(f"{BASE_URL}/api/appointments", json=appt_payload, headers=headers)
        
        # Check for 502 (Gateway failure to reach Flask)
        if appt_res.status_code == 502:
            pytest.fail("Gateway 502: Node cannot reach Flask. Check Flask port and routes.")
            
        assert appt_res.status_code == 201
    
        appt_data = appt_res.json()
        # Handle potential nesting in response
        appt_obj = appt_data.get("appointment", appt_data) if isinstance(appt_data, dict) else appt_data
        appointment_id = appt_obj.get("appointment_id") or appt_obj.get("id")
    
        # Generate the Invoice (using the NEW /api/invoices endpoint)
        invoice_payload = {
            "appointment_id": appointment_id,
            "cpt_id": 1, 
            "patient_id": 1,
            "status": "unpaid"
        }
    
        # Again, make the request FIRST
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_payload, headers=headers)
    
        # Now it is safe to check the response
        assert response.status_code == 201
        inv_data = response.json()
        assert inv_data["appointment_id"] == appointment_id

    def test_unauthorized_invoice_access(self):
        """
        Expects: 401 Unauthorized
        """
        response = requests.get(f"{BASE_URL}/api/invoices")
        assert response.status_code == 401

    def test_doctor_can_view_invoices(self, doctor_token):
        """
        Expects: 200 OK
        """
        headers = {"Authorization": f"Bearer {doctor_token}"}
        response = requests.get(f"{BASE_URL}/api/invoices", headers=headers)
        
        if response.status_code == 502:
             pytest.fail("Gateway 502: Node cannot reach Flask for GET /invoices.")
             
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)