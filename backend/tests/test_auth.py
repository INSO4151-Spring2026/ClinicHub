"""
Tests for authentication endpoints:
  POST /api/login
  POST /api/logout
  GET  /api/profile
  POST /api/refresh
"""
import pytest


class TestLogin:
    def test_login_valid_credentials(self, client, admin_user):
        res = client.post("/api/login", json={
            "email": "admin@test.com",
            "password": "password123",
        })
        assert res.status_code == 200
        data = res.get_json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_wrong_password(self, client, admin_user):
        res = client.post("/api/login", json={
            "email": "admin@test.com",
            "password": "wrongpassword",
        })
        assert res.status_code == 401
        assert "error" in res.get_json()

    def test_login_nonexistent_email(self, client):
        res = client.post("/api/login", json={
            "email": "nobody@test.com",
            "password": "password123",
        })
        assert res.status_code == 401
        assert "error" in res.get_json()

    def test_login_missing_email(self, client):
        res = client.post("/api/login", json={"password": "password123"})
        assert res.status_code == 401

    def test_login_missing_password(self, client, admin_user):
        res = client.post("/api/login", json={"email": "admin@test.com"})
        assert res.status_code == 401

    def test_login_empty_body(self, client):
        res = client.post("/api/login", json={})
        assert res.status_code == 401

    def test_login_returns_string_tokens(self, client, admin_user):
        res = client.post("/api/login", json={
            "email": "admin@test.com",
            "password": "password123",
        })
        data = res.get_json()
        assert isinstance(data["access_token"], str)
        assert isinstance(data["refresh_token"], str)
        assert len(data["access_token"]) > 0
        assert len(data["refresh_token"]) > 0


class TestLogout:
    def test_logout_returns_200(self, client):
        res = client.post("/api/logout")
        assert res.status_code == 200
        assert "message" in res.get_json()

    def test_logout_without_token_still_succeeds(self, client):
        # Logout is stateless — no token needed
        res = client.post("/api/logout")
        assert res.status_code == 200


class TestProfile:
    def test_profile_with_valid_token(self, client, admin_user, auth_headers):
        res = client.get("/api/profile", headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["user_id"] == admin_user.user_id
        assert data["email"] == admin_user.email

    def test_profile_without_token(self, client):
        res = client.get("/api/profile")
        assert res.status_code == 401
        assert "error" in res.get_json()

    def test_profile_with_malformed_header(self, client):
        res = client.get("/api/profile", headers={"Authorization": "InvalidHeader"})
        assert res.status_code == 401

    def test_profile_with_invalid_token(self, client):
        res = client.get("/api/profile", headers={"Authorization": "Bearer not.a.valid.token"})
        assert res.status_code == 403

    def test_profile_with_expired_token(self, client, app, admin_user):
        import jwt
        from datetime import datetime, timedelta, timezone

        expired_token = jwt.encode(
            {"user_id": admin_user.user_id, "exp": datetime.now(timezone.utc) - timedelta(seconds=1)},
            app.config["SECRET_KEY"],
            algorithm="HS256",
        )
        res = client.get("/api/profile", headers={"Authorization": f"Bearer {expired_token}"})
        assert res.status_code == 403


class TestRefresh:
    def test_refresh_with_valid_refresh_token(self, client, admin_user):
        # Login to get a refresh token
        login_res = client.post("/api/login", json={
            "email": "admin@test.com",
            "password": "password123",
        })
        refresh_token = login_res.get_json()["refresh_token"]

        res = client.post("/api/refresh", json={"refresh_token": refresh_token})
        assert res.status_code == 200
        data = res.get_json()
        assert "access_token" in data
        assert isinstance(data["access_token"], str)

    def test_refresh_without_token(self, client):
        res = client.post("/api/refresh", json={})
        assert res.status_code == 400
        assert "error" in res.get_json()

    def test_refresh_missing_body(self, client):
        # No JSON body — get_json() returns None, route should return 400
        res = client.post("/api/refresh", json=None, content_type="application/json")
        assert res.status_code == 400

    def test_refresh_with_invalid_token(self, client):
        res = client.post("/api/refresh", json={"refresh_token": "invalid.token.here"})
        assert res.status_code == 403

    def test_refresh_with_expired_token(self, client, app, admin_user):
        import jwt
        from datetime import datetime, timedelta, timezone

        expired_token = jwt.encode(
            {"user_id": admin_user.user_id, "exp": datetime.now(timezone.utc) - timedelta(seconds=1)},
            app.config["SECRET_KEY"],
            algorithm="HS256",
        )
        res = client.post("/api/refresh", json={"refresh_token": expired_token})
        assert res.status_code == 403

    def test_refresh_produces_usable_access_token(self, client, admin_user):
        """New access token from /refresh should work on /profile."""
        login_res = client.post("/api/login", json={
            "email": "admin@test.com",
            "password": "password123",
        })
        refresh_token = login_res.get_json()["refresh_token"]

        refresh_res = client.post("/api/refresh", json={"refresh_token": refresh_token})
        new_access_token = refresh_res.get_json()["access_token"]

        profile_res = client.get(
            "/api/profile",
            headers={"Authorization": f"Bearer {new_access_token}"},
        )
        assert profile_res.status_code == 200
