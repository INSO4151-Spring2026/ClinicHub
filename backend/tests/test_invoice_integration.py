import pytest
from datetime import datetime, timedelta, timezone, date
from app import db as _db
from app.models.appointment import Appointment
from app.models.cpt import CPT
from app.models.insurance_plan import InsurancePlan

try:
    from app.models.cpt_code import CPTCode
except ImportError:
    from app.models.cpt import CPTCode

_APPT_TIME = datetime(2026, 7, 1, 10, 0, 0, tzinfo=timezone.utc)

@pytest.mark.integration
class TestBillingIntegration:
    """
    Integration tests for ClinicHub Invoice system using the shared test client.
    """

    def test_receptionist_can_create_invoice(self, app, client, receptionist_token, doctor_user, sample_patient, monkeypatch):
        """
        Test: Inject prerequisites (CPTCode, CPT log, Insurance), stage a completed appointment,
              then generate an invoice via the internal test client.
        Expects: 201 Created
        """
        headers = {"Authorization": f"Bearer {receptionist_token}"}
        
       
        master_code = CPTCode(
            code="99213",
            description="Standard Outpatient Office Visit",
            category="Evaluation",
            default_price=150.00,
            is_active=True
        )
        _db.session.add(master_code)
        _db.session.commit()
        _db.session.flush()

        master_code_id = master_code.cpt_code_id
        
      
        mock_cpt = CPT(
            patient_id=sample_patient.patient_id,
            cpt_code_id=master_code_id, 
            service_date=date(2026, 7, 1),
            status="draft",
            quantity=1,
            subtotal=150.00,
            tax=0.00
        )
        _db.session.add(mock_cpt)
        _db.session.commit()
        _db.session.flush()

        
        cpt_id = mock_cpt.cpt_id

        
        class MockInsurancePlan:
            def __init__(self):
                self.plan_id = 1
                self.carrier_name = "Standard Insurance"
                self.copay = 20.00

        monkeypatch.setattr(InsurancePlan, "active_for_patient", lambda patient_id: MockInsurancePlan())
    
    
        appt = Appointment(
            patient_id=sample_patient.patient_id,
            provider_user_id=doctor_user.user_id,
            scheduled_start=_APPT_TIME,
            scheduled_end=_APPT_TIME + timedelta(minutes=30),
            status="completed",
            cpt_id=cpt_id, 
            reason="Integration Verification Lifecycle"
        )
        
        _db.session.add(appt)
        _db.session.commit()
        _db.session.flush()
        
        appointment_id = getattr(appt, "appointment_id", getattr(appt, "id", None))
        _db.session.expire(appt)

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