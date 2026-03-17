"""
Tests for patient CRUD endpoints:
  POST   /api/patients          - create
  GET    /api/patients/<id>     - read one
  PUT    /api/patients/<id>     - update
  DELETE /api/patients/<id>     - delete
  GET    /api/patients          - list (pagination + search)
"""
import pytest


# ---------------------------------------------------------------------------
# POST /api/patients - Create
# ---------------------------------------------------------------------------

class TestCreatePatient:
    BASE_PAYLOAD = {
        "first_name": "John",
        "last_name": "Smith",
        "dob": "1980-06-15",
        "sex": "male",
        "email": "john.smith@test.com",
        "phone": "555-1111",
        "address": "10 Oak Ave",
        "emergency_contact_name": "Mary Smith",
        "emergency_contact_phone": "555-2222",
    }

    def test_create_patient_success(self, client, auth_headers):
        res = client.post("/api/patients", json=self.BASE_PAYLOAD, headers=auth_headers)
        assert res.status_code == 201
        data = res.get_json()
        assert data["message"] == "Patient created successfully"
        assert data["patient"]["first_name"] == "John"
        assert data["patient"]["last_name"] == "Smith"
        assert data["patient"]["patient_id"] is not None

    def test_create_patient_minimal_fields(self, client, auth_headers):
        res = client.post("/api/patients", json={
            "first_name": "Min",
            "last_name": "Imal",
            "dob": "2000-01-01",
        }, headers=auth_headers)
        assert res.status_code == 201

    def test_create_patient_missing_first_name(self, client, auth_headers):
        payload = {**self.BASE_PAYLOAD}
        del payload["first_name"]
        res = client.post("/api/patients", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "first_name" in res.get_json()["error"]

    def test_create_patient_missing_last_name(self, client, auth_headers):
        payload = {**self.BASE_PAYLOAD}
        del payload["last_name"]
        res = client.post("/api/patients", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_create_patient_missing_dob(self, client, auth_headers):
        payload = {**self.BASE_PAYLOAD}
        del payload["dob"]
        res = client.post("/api/patients", json=payload, headers=auth_headers)
        assert res.status_code == 400

    def test_create_patient_invalid_dob_format(self, client, auth_headers):
        payload = {**self.BASE_PAYLOAD, "dob": "15-06-1980"}
        res = client.post("/api/patients", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "dob" in res.get_json()["error"].lower()

    def test_create_patient_invalid_sex(self, client, auth_headers):
        payload = {**self.BASE_PAYLOAD, "email": "unique@test.com", "sex": "unknown"}
        res = client.post("/api/patients", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "sex" in res.get_json()["error"].lower()

    def test_create_patient_valid_sex_values(self, client, auth_headers):
        for i, sex in enumerate(["male", "female", "other", "prefer_not_to_say"]):
            res = client.post("/api/patients", json={
                "first_name": f"Patient{i}",
                "last_name": "Test",
                "dob": "1990-01-01",
                "sex": sex,
                "email": f"patient{i}@test.com",
            }, headers=auth_headers)
            assert res.status_code == 201, f"Failed for sex={sex}"

    def test_create_patient_duplicate_email(self, client, auth_headers, sample_patient):
        res = client.post("/api/patients", json={
            "first_name": "Dup",
            "last_name": "Email",
            "dob": "1990-01-01",
            "email": sample_patient.email,  # already exists
        }, headers=auth_headers)
        assert res.status_code == 409

    def test_create_patient_response_shape(self, client, auth_headers):
        res = client.post("/api/patients", json={
            "first_name": "Shape",
            "last_name": "Test",
            "dob": "1995-03-10",
        }, headers=auth_headers)
        patient = res.get_json()["patient"]
        expected_keys = {
            "patient_id", "first_name", "last_name", "dob",
            "sex", "email", "phone", "address",
            "emergency_contact_name", "emergency_contact_phone",
            "created_at", "updated_at",
        }
        assert expected_keys.issubset(patient.keys())


# ---------------------------------------------------------------------------
# GET /api/patients/<id> - Read one
# ---------------------------------------------------------------------------

class TestGetPatient:
    def test_get_existing_patient(self, client, auth_headers, sample_patient):
        res = client.get(f"/api/patients/{sample_patient.patient_id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["patient_id"] == sample_patient.patient_id
        assert data["first_name"] == sample_patient.first_name
        assert data["email"] == sample_patient.email

    def test_get_nonexistent_patient(self, client, auth_headers):
        res = client.get("/api/patients/99999", headers=auth_headers)
        assert res.status_code == 404
        assert "error" in res.get_json()

    def test_get_patient_returns_all_fields(self, client, auth_headers, sample_patient):
        res = client.get(f"/api/patients/{sample_patient.patient_id}", headers=auth_headers)
        data = res.get_json()
        assert data["dob"] == "1990-05-15"
        assert data["sex"] == "female"
        assert data["phone"] == "555-0001"
        assert data["address"] == "123 Main St"
        assert data["emergency_contact_name"] == "John Doe"


# ---------------------------------------------------------------------------
# PUT /api/patients/<id> - Update
# ---------------------------------------------------------------------------

class TestUpdatePatient:
    def test_update_first_name(self, client, auth_headers, sample_patient):
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"first_name": "Janet"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["patient"]["first_name"] == "Janet"

    def test_update_multiple_fields(self, client, auth_headers, sample_patient):
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"phone": "555-9999", "address": "456 New St"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        patient = res.get_json()["patient"]
        assert patient["phone"] == "555-9999"
        assert patient["address"] == "456 New St"

    def test_update_dob_with_valid_format(self, client, auth_headers, sample_patient):
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"dob": "1991-07-20"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.get_json()["patient"]["dob"] == "1991-07-20"

    def test_update_dob_invalid_format(self, client, auth_headers, sample_patient):
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"dob": "20-07-1991"},
            headers=auth_headers,
        )
        assert res.status_code == 400

    def test_update_sex_to_valid_value(self, client, auth_headers, sample_patient):
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"sex": "prefer_not_to_say"},
            headers=auth_headers,
        )
        assert res.status_code == 200

    def test_update_sex_to_invalid_value(self, client, auth_headers, sample_patient):
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"sex": "unknown"},
            headers=auth_headers,
        )
        assert res.status_code == 400

    def test_update_email_to_duplicate(self, client, auth_headers, sample_patient):
        # Create a second patient
        client.post("/api/patients", json={
            "first_name": "Second",
            "last_name": "Patient",
            "dob": "1985-01-01",
            "email": "second@test.com",
        }, headers=auth_headers)
        # Try to assign second's email to first
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"email": "second@test.com"},
            headers=auth_headers,
        )
        assert res.status_code == 409

    def test_update_nonexistent_patient(self, client, auth_headers):
        res = client.put("/api/patients/99999", json={"first_name": "Ghost"}, headers=auth_headers)
        assert res.status_code == 404

    def test_update_returns_updated_patient(self, client, auth_headers, sample_patient):
        res = client.put(
            f"/api/patients/{sample_patient.patient_id}",
            json={"last_name": "Updated"},
            headers=auth_headers,
        )
        data = res.get_json()
        assert "message" in data
        assert "patient" in data
        assert data["patient"]["last_name"] == "Updated"


# ---------------------------------------------------------------------------
# DELETE /api/patients/<id> - Delete
# ---------------------------------------------------------------------------

class TestDeletePatient:
    def test_delete_existing_patient(self, client, auth_headers, sample_patient):
        pid = sample_patient.patient_id
        res = client.delete(f"/api/patients/{pid}", headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["patient_id"] == pid
        assert "message" in data

    def test_delete_nonexistent_patient(self, client, auth_headers):
        res = client.delete("/api/patients/99999", headers=auth_headers)
        assert res.status_code == 404

    def test_deleted_patient_no_longer_retrievable(self, client, auth_headers, sample_patient):
        pid = sample_patient.patient_id
        client.delete(f"/api/patients/{pid}", headers=auth_headers)
        res = client.get(f"/api/patients/{pid}", headers=auth_headers)
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/patients - List / pagination / search
# ---------------------------------------------------------------------------

class TestListPatients:
    def _create_patients(self, client, auth_headers, count=5):
        for i in range(count):
            client.post("/api/patients", json={
                "first_name": f"First{i}",
                "last_name": f"Last{i}",
                "dob": "1990-01-01",
                "email": f"patient{i}@test.com",
            }, headers=auth_headers)

    def test_list_empty_returns_pagination(self, client, auth_headers):
        res = client.get("/api/patients", headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert "patients" in data
        assert "pagination" in data

    def test_list_returns_all_created_patients(self, client, auth_headers):
        self._create_patients(client, auth_headers, 3)
        res = client.get("/api/patients", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["pagination"]["total"] == 3

    def test_list_default_per_page_is_10(self, client, auth_headers):
        self._create_patients(client, auth_headers, 15)
        res = client.get("/api/patients", headers=auth_headers)
        assert len(res.get_json()["patients"]) == 10

    def test_list_custom_per_page(self, client, auth_headers):
        self._create_patients(client, auth_headers, 5)
        res = client.get("/api/patients?per_page=3", headers=auth_headers)
        assert len(res.get_json()["patients"]) == 3

    def test_list_per_page_capped_at_100(self, client, auth_headers):
        self._create_patients(client, auth_headers, 5)
        res = client.get("/api/patients?per_page=200", headers=auth_headers)
        data = res.get_json()
        assert data["pagination"]["per_page"] <= 100

    def test_list_pagination_page_2(self, client, auth_headers):
        self._create_patients(client, auth_headers, 5)
        res = client.get("/api/patients?per_page=3&page=2", headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert len(data["patients"]) == 2  # 5 total, 3 on page 1, 2 on page 2

    def test_list_pagination_metadata(self, client, auth_headers):
        self._create_patients(client, auth_headers, 5)
        res = client.get("/api/patients?per_page=3&page=1", headers=auth_headers)
        pagination = res.get_json()["pagination"]
        assert pagination["total"] == 5
        assert pagination["pages"] == 2
        assert pagination["has_next"] is True
        assert pagination["has_prev"] is False

    def test_list_search_by_first_name(self, client, auth_headers):
        self._create_patients(client, auth_headers, 3)
        res = client.get("/api/patients?search=First0", headers=auth_headers)
        assert res.status_code == 200
        patients = res.get_json()["patients"]
        assert len(patients) == 1
        assert patients[0]["first_name"] == "First0"

    def test_list_search_by_last_name(self, client, auth_headers):
        self._create_patients(client, auth_headers, 3)
        res = client.get("/api/patients?search=Last2", headers=auth_headers)
        patients = res.get_json()["patients"]
        assert len(patients) == 1
        assert patients[0]["last_name"] == "Last2"

    def test_list_search_by_email(self, client, auth_headers):
        self._create_patients(client, auth_headers, 3)
        res = client.get("/api/patients?search=patient1@test.com", headers=auth_headers)
        patients = res.get_json()["patients"]
        assert len(patients) == 1
        assert patients[0]["email"] == "patient1@test.com"

    def test_list_search_no_results(self, client, auth_headers):
        self._create_patients(client, auth_headers, 3)
        res = client.get("/api/patients?search=zzznomatch", headers=auth_headers)
        assert res.get_json()["pagination"]["total"] == 0

    def test_list_default_sort_by_last_name(self, client, auth_headers):
        client.post("/api/patients", json={"first_name": "Z", "last_name": "Zebra", "dob": "1990-01-01"}, headers=auth_headers)
        client.post("/api/patients", json={"first_name": "A", "last_name": "Apple", "dob": "1990-01-01"}, headers=auth_headers)
        res = client.get("/api/patients", headers=auth_headers)
        patients = res.get_json()["patients"]
        last_names = [p["last_name"] for p in patients]
        assert last_names == sorted(last_names)

    def test_list_sort_desc(self, client, auth_headers):
        client.post("/api/patients", json={"first_name": "Z", "last_name": "Zebra", "dob": "1990-01-01"}, headers=auth_headers)
        client.post("/api/patients", json={"first_name": "A", "last_name": "Apple", "dob": "1990-01-01"}, headers=auth_headers)
        res = client.get("/api/patients?order=desc", headers=auth_headers)
        patients = res.get_json()["patients"]
        last_names = [p["last_name"] for p in patients]
        assert last_names == sorted(last_names, reverse=True)

    def test_list_invalid_sort_falls_back_to_last_name(self, client, auth_headers):
        self._create_patients(client, auth_headers, 3)
        res = client.get("/api/patients?sort_by=invalid_field", headers=auth_headers)
        assert res.status_code == 200
