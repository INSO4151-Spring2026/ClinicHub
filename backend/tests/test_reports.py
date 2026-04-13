import pytest
from datetime import date
from app.models.cpt import CPT
from app.models.cpt_code import CPTCode
from app import db

# -----------------------------------------------------------------------------
# Setup Helper: Seed CPT Codes for Testing
# -----------------------------------------------------------------------------
@pytest.fixture
def sample_cpt_code(app):
    """Create a standard CPT code for billing tests."""
    code = CPTCode(
        code="99213",
        description="Office Visit",
        category="Office Visit",
        default_price=150.00
    )
    db.session.add(code)
    db.session.commit()
    return code

# -----------------------------------------------------------------------------
# GET /api/reports/daily-revenue Tests
# -----------------------------------------------------------------------------

def test_get_daily_revenue_success(client, auth_headers, sample_patient, sample_cpt_code):
    """
    Test that the report correctly sums 'paid' records and ignores others.
    """
    test_date = date(2026, 4, 4)
    date_str = test_date.strftime("%Y-%m-%d")

    # Seed 3 records for the same day
    # 1. PAID: $100 + $10 tax = $110
    c1 = CPT(patient_id=sample_patient.patient_id, cpt_code_id=sample_cpt_code.cpt_code_id,
             service_date=test_date, status='paid', subtotal=100.00, tax=10.00)
    
    # 2. PAID: $200 + $20 tax = $220
    c2 = CPT(patient_id=sample_patient.patient_id, cpt_code_id=sample_cpt_code.cpt_code_id,
             service_date=test_date, status='paid', subtotal=200.00, tax=20.00)
    
    # 3. DRAFT: $50 (Should be ignored by the query)
    c3 = CPT(patient_id=sample_patient.patient_id, cpt_code_id=sample_cpt_code.cpt_code_id,
             service_date=test_date, status='draft', subtotal=50.00, tax=5.00)

    db.session.add_all([c1, c2, c3])
    db.session.commit()

    # Execute request
    response = client.get(f"/api/reports/daily-revenue?date={date_str}", headers=auth_headers)
    res_data = response.get_json()

    # Assertions
    assert response.status_code == 200
    assert res_data["transaction_count"] == 2  # Only the 2 'paid' ones
    assert res_data["data"]["total_revenue"] == 330.00 # (110 + 220)
    assert res_data["data"]["subtotal"] == 300.00
    assert res_data["data"]["tax"] == 30.00

def test_get_daily_revenue_empty_day(client, auth_headers):
    """Verify response when no records exist for a given date."""
    response = client.get("/api/reports/daily-revenue?date=2020-01-01", headers=auth_headers)
    res_data = response.get_json()

    assert response.status_code == 200
    assert res_data["transaction_count"] == 0
    assert res_data["data"]["total_revenue"] == 0.0

def test_get_daily_revenue_unauthorized(client, doctor_auth_headers):
    """
    Ensure doctors cannot see the revenue report (Role check).
    Assuming only 'admin' has permission.
    """
    response = client.get("/api/reports/daily-revenue?date=2026-04-04", headers=doctor_auth_headers)
    assert response.status_code == 403 # Forbidden

def test_get_daily_revenue_missing_date(client, auth_headers):
    """Check validation for missing date parameter."""
    response = client.get("/api/reports/daily-revenue", headers=auth_headers)
    assert response.status_code == 400
    assert "error" in response.get_json()