"""
Tests for JWT utility functions in app/utils/jwt_handler.py:
  generate_access_token
  generate_refresh_token
  verify_token
"""
import jwt
import pytest
from datetime import datetime, timedelta, timezone

from app.utils.jwt_handler import (
    generate_access_token,
    generate_refresh_token,
    verify_token,
    ACCESS_TOKEN_EXPIRATION,
    REFRESH_TOKEN_EXPIRATION,
)

# HELPER: Mimics a User object since the handler expects object.attribute
class MockUser:
    def __init__(self, user_id, role_id=None):
        self.user_id = user_id
        self.role_id = role_id

class TestGenerateAccessToken:
    def test_returns_string(self, app):
        user = MockUser(1, "admin")
        token = generate_access_token(user)
        assert isinstance(token, str)

    def test_contains_user_id(self, app):
        user = MockUser(42, "doctor")
        token = generate_access_token(user)
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        assert payload["user_id"] == 42
        assert payload["role"] == "doctor"

    def test_contains_exp_claim(self, app):
        user = MockUser(1, "admin")
        token = generate_access_token(user)
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        assert "exp" in payload

    def test_expiry_is_roughly_15_minutes(self, app):
        before = datetime.now(timezone.utc)
        user = MockUser(1, "admin")
        token = generate_access_token(user)
        after = datetime.now(timezone.utc)

        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)

        expected_min = before + timedelta(minutes=ACCESS_TOKEN_EXPIRATION) - timedelta(seconds=5)
        expected_max = after + timedelta(minutes=ACCESS_TOKEN_EXPIRATION) + timedelta(seconds=5)
        assert expected_min <= exp <= expected_max

    def test_different_users_produce_different_tokens(self, app):
        user1 = MockUser(1, "admin")
        user2 = MockUser(2, "admin")
        token1 = generate_access_token(user1)
        token2 = generate_access_token(user2)
        assert token1 != token2

    def test_signed_with_app_secret_key(self, app):
        user = MockUser(1, "admin")
        token = generate_access_token(user)
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, "wrong-secret-key-that-is-long-enough-for-hs256", algorithms=["HS256"])


class TestGenerateRefreshToken:
    def test_returns_string(self, app):
        user = MockUser(1)
        token = generate_refresh_token(user)
        assert isinstance(token, str)

    def test_contains_user_id(self, app):
        user = MockUser(7)
        token = generate_refresh_token(user)
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        assert payload["user_id"] == 7

    def test_expiry_is_roughly_7_days(self, app):
        before = datetime.now(timezone.utc)
        user = MockUser(1)
        token = generate_refresh_token(user)
        after = datetime.now(timezone.utc)

        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)

        expected_min = before + timedelta(days=REFRESH_TOKEN_EXPIRATION) - timedelta(seconds=5)
        expected_max = after + timedelta(days=REFRESH_TOKEN_EXPIRATION) + timedelta(seconds=5)
        assert expected_min <= exp <= expected_max

    def test_refresh_token_longer_lived_than_access_token(self, app):
        user = MockUser(1, "admin")
        access = generate_access_token(user)
        refresh = generate_refresh_token(user)

        access_payload = jwt.decode(access, app.config["SECRET_KEY"], algorithms=["HS256"])
        refresh_payload = jwt.decode(refresh, app.config["SECRET_KEY"], algorithms=["HS256"])

        assert refresh_payload["exp"] > access_payload["exp"]


class TestVerifyToken:
    def test_valid_token_returns_payload(self, app):
        user = MockUser(99, "nurse")
        token = generate_access_token(user)
        payload = verify_token(token)
        assert payload is not None
        assert payload["user_id"] == 99
        assert payload["role"] == "nurse"

    def test_expired_token_returns_none(self, app):
        expired = jwt.encode(
            {"user_id": 1, "role": "admin", "exp": datetime.now(timezone.utc) - timedelta(seconds=1)},
            app.config["SECRET_KEY"],
            algorithm="HS256",
        )
        assert verify_token(expired) is None

    def test_tampered_signature_returns_none(self, app):
        user = MockUser(1, "admin")
        token = generate_access_token(user)
        parts = token.split(".")
        mid = len(parts[2]) // 2
        flipped = "B" if parts[2][mid] != "B" else "C"
        parts[2] = parts[2][:mid] + flipped + parts[2][mid + 1:]
        tampered = ".".join(parts)
        assert verify_token(tampered) is None

    def test_valid_refresh_token_also_verifies(self, app):
        user = MockUser(5)
        token = generate_refresh_token(user)
        payload = verify_token(token)
        assert payload is not None
        assert payload["user_id"] == 5