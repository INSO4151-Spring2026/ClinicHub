import pytest
import requests

# Final check: Does your app run on 5000? 
# If you use 'flask run', it might be 5000. If you use 'python run.py', check the code.
BASE_URL = "http://localhost:5000"

@pytest.fixture
def admin_token():
    payload = {"email": "admin@clinic.com", "password": "123"}
    response = requests.post(f"{BASE_URL}/api/login", json=payload)
    
    if response.status_code != 200:
        # This print will show up if you run: pytest -s
        print(f"\n--- LOGIN FAILED ---")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        pytest.fail("Could not log in admin. Check if user exists in DB with hashed password '123'.")
        
    return response.json().get("access_token")

def test_admin_access_with_valid_token(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
    
    # If this is 401, your 'verify_token' in jwt_handler.py is failing.
    # Check if your SECRET_KEY in config.py matches what the handler uses.
    assert response.status_code == 200

def test_receptionist_cannot_access_admin_stats():
    login_res = requests.post(f"{BASE_URL}/api/login", json={
        "email": "receptionist@clinic.com", 
        "password": "123"
    })
    
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
    
    # We WANT 403 (Forbidden)
    assert response.status_code == 403 

def test_access_denied_with_fake_token():
    # This tests your middleware/decorator directly
    headers = {"Authorization": "Bearer fake.jwt.token"}
    response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
    assert response.status_code == 401