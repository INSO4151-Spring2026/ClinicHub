import pytest
import requests

NODE_URL = "http://localhost:5000/api"

@pytest.fixture
def admin_token():
    """Helper to get a fresh token before tests"""
    payload = {
        "email": "admin@clinic.com",
        "password": "123"
    }
    response = requests.post(f"{NODE_URL}/login", json=payload)
    return response.json().get("token")

# --- TEST 1: Authentication Success ---
def test_admin_access_with_valid_token(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{NODE_URL}/admin/stats", headers=headers)
    
    assert response.status_code == 200
    assert "analytics" in response.json().get("message").lower()

# --- TEST 2: Role-Based Authorization Failure ---
def test_receptionist_cannot_access_admin_stats():
    # 1. Login as Receptionist
    login_res = requests.post(f"{NODE_URL}/login", json={
        "email": "receptionist@clinic.com", 
        "password": "123"
    })
    token = login_res.json().get("token")
    
    # 2. Try to hit Admin route
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{NODE_URL}/admin/stats", headers=headers)
    
    # Assert Node.js middleware blocked it
    assert response.status_code == 403 

# --- TEST 3: Invalid Token ---
def test_access_denied_with_fake_token():
    headers = {"Authorization": "Bearer not-a-real-token"}
    response = requests.get(f"{NODE_URL}/admin/stats", headers=headers)
    
    # If middleware has bad tokens match with 401
    assert response.status_code == 401