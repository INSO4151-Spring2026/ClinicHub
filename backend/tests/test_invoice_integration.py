import pytest
from datetime import datetime, timedelta, timezone
from app import db as _db
from app.models.appointment import Appointment

_APPT_TIME = datetime(2026, 7, 1, 10, 0, 0, tzinfo=timezone.utc)

@pytest.mark.integration
class TestBillingIntegration:
    """
    Integration tests for ClinicHub Invoice system using the shared test client.
    """

    def test_receptionist_can_create_invoice(self, app, client, receptionist_token, doctor_user, sample_patient):
        """
        Test: Inject a completed appointment into the DB using existing fixtures,
              then generate an invoice via the internal test client.
        Expects: 201 Created
        """
        headers = {"Authorization": f"Bearer {receptionist_token}"}
    
       
        appt = Appointment(
            patient_id=sample_patient.patient_id,
            provider_user_id=doctor_user.user_id,
            scheduled_start=_APPT_TIME,
            scheduled_end=_APPT_TIME + timedelta(minutes=30),
            status="completed",
            cpt_id=1, 
            reason="Integration Verification Lifecycle"
        )
        
      
        _db.session.add(appt)
        _db.session.commit()
        appointment_id = appt.appointment_id

      
        invoice_payload = {
            "appointment_id": appointment_id
        }
    

        response = client.post("/api/invoices", json=invoice_payload, headers=headers)
    
        assert response.status_code == 201
        
        inv_data = response.get_json()
        assert "invoice" in inv_data
        assert inv_data["invoice"]["appointment_id"] == appointment_id

    def test_unauthorized_invoice_access(self, client):
        """
        Expects: 401 Unauthorized
        """
        response = client.get("/api/invoices")
        assert response.status_code == 401

    def test_doctor_can_view_invoices(self, client, doctor_token):
        """
        Expects: 200 OK
        """
        headers = {"Authorization": f"Bearer {doctor_token}"}
        response = client.get("/api/invoices", headers=headers)
             
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)