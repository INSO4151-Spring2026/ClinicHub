import pytest


def test_receptionist_can_save_and_fetch_patient_plan(
    client, receptionist_auth_headers
):
    # Save plan (JSON)
    res = client.post(
        "/api/patients/1/plan",
        json={
            "carrier_name": "Aetna",
            "member_id": "XYZ123",
            "group_id": "GRP001",
            "plan_type": "PPO",
            "effective_date": "2026-01-01",
            "copay": "25.00",
        },
        headers=receptionist_auth_headers,
    )
    assert res.status_code == 201
    body = res.get_json()
    assert body["plan"]["patient_id"] == 1
    assert body["plan"]["carrier_name"] == "Aetna"

    # Fetch plan
    res2 = client.get("/api/patients/1/plan", headers=receptionist_auth_headers)
    assert res2.status_code == 200
    body2 = res2.get_json()
    assert body2["plan"]["member_id"] == "XYZ123"
    assert body2["plan"]["is_active"] is True


def test_doctor_cannot_save_patient_plan(client, doctor_auth_headers):
    res = client.post(
        "/api/patients/1/plan",
        json={"carrier_name": "Cigna", "member_id": "ABC"},
        headers=doctor_auth_headers,
    )
    assert res.status_code == 403
