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


class TestGenerateAccessToken:
    def test_returns_string(self, app):
        token = generate_access_token(1)
        assert isinstance(token, str)

    def test_contains_user_id(self, app):
        token = generate_access_token(42)
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        assert payload["user_id"] == 42

    def test_contains_exp_claim(self, app):
        token = generate_access_token(1)
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        assert "exp" in payload

    def test_expiry_is_roughly_15_minutes(self, app):
        before = datetime.now(timezone.utc)
        token = generate_access_token(1)
        after = datetime.now(timezone.utc)

        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)

        expected_min = before + timedelta(minutes=ACCESS_TOKEN_EXPIRATION) - timedelta(seconds=5)
        expected_max = after + timedelta(minutes=ACCESS_TOKEN_EXPIRATION) + timedelta(seconds=5)
        assert expected_min <= exp <= expected_max

    def test_different_users_produce_different_tokens(self, app):
        token1 = generate_access_token(1)
        token2 = generate_access_token(2)
        assert token1 != token2

    def test_signed_with_app_secret_key(self, app):
        token = generate_access_token(1)
        # Should raise if decoded with a wrong key
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, "wrong-secret-key-that-is-long-enough-for-hs256", algorithms=["HS256"])


class TestGenerateRefreshToken:
    def test_returns_string(self, app):
        token = generate_refresh_token(1)
        assert isinstance(token, str)

    def test_contains_user_id(self, app):
        token = generate_refresh_token(7)
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        assert payload["user_id"] == 7

    def test_expiry_is_roughly_7_days(self, app):
        before = datetime.now(timezone.utc)
        token = generate_refresh_token(1)
        after = datetime.now(timezone.utc)

        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)

        expected_min = before + timedelta(days=REFRESH_TOKEN_EXPIRATION) - timedelta(seconds=5)
        expected_max = after + timedelta(days=REFRESH_TOKEN_EXPIRATION) + timedelta(seconds=5)
        assert expected_min <= exp <= expected_max

    def test_refresh_token_longer_lived_than_access_token(self, app):
        access = generate_access_token(1)
        refresh = generate_refresh_token(1)

        access_payload = jwt.decode(access, app.config["SECRET_KEY"], algorithms=["HS256"])
        refresh_payload = jwt.decode(refresh, app.config["SECRET_KEY"], algorithms=["HS256"])

        assert refresh_payload["exp"] > access_payload["exp"]


class TestVerifyToken:
    def test_valid_token_returns_payload(self, app):
        token = generate_access_token(99)
        payload = verify_token(token)
        assert payload is not None
        assert payload["user_id"] == 99

    def test_expired_token_returns_none(self, app):
        expired = jwt.encode(
            {"user_id": 1, "exp": datetime.now(timezone.utc) - timedelta(seconds=1)},
            app.config["SECRET_KEY"],
            algorithm="HS256",
        )
        assert verify_token(expired) is None

    def test_tampered_signature_returns_none(self, app):
        token = generate_access_token(1)
        # Flip a character in the middle of the signature.
        # Avoid the last character: for a 32-byte HMAC the final base64url char
        # only carries 4 significant bits, so adjacent chars can decode identically.
        parts = token.split(".")
        mid = len(parts[2]) // 2
        flipped = "B" if parts[2][mid] != "B" else "C"
        parts[2] = parts[2][:mid] + flipped + parts[2][mid + 1:]
        tampered = ".".join(parts)
        assert verify_token(tampered) is None

    def test_wrong_secret_returns_none(self, app):
        bad_token = jwt.encode(
            {"user_id": 1, "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
            "wrong-secret-key-that-is-long-enough-for-hs256",
            algorithm="HS256",
        )
        assert verify_token(bad_token) is None

    def test_garbage_string_returns_none(self, app):
        assert verify_token("not.a.token") is None

    def test_empty_string_returns_none(self, app):
        assert verify_token("") is None

    def test_valid_refresh_token_also_verifies(self, app):
        token = generate_refresh_token(5)
        payload = verify_token(token)
        assert payload is not None
        assert payload["user_id"] == 5
