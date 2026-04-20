import pytest
import requests

BASE_URL = "http://localhost:5000"

# Use the marker so conftest.py knows to create 'test_integration.db'
@pytest.mark.integration
def test_admin_access_with_valid_token(admin_token):
    """
    'admin_token' is now pulled from conftest.py.
    conftest.py will create the DB file, seed the user, 
    and generate the token before this test starts.
    """
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
    
    assert response.status_code == 200

@pytest.mark.integration
def test_receptionist_cannot_access_admin_stats(receptionist_token):
    headers = {"Authorization": f"Bearer {receptionist_token}"}
    response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
    
    assert response.status_code == 403 

@pytest.mark.integration
def test_access_denied_with_fake_token():
    headers = {"Authorization": "Bearer fake.jwt.token"}
    response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
    assert response.status_code == 401