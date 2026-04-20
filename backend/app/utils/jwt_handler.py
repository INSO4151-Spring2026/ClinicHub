from app.models import user
import jwt
from datetime import datetime, timedelta, timezone
from flask import current_app


ACCESS_TOKEN_EXPIRATION = 15 # minutes
REFRESH_TOKEN_EXPIRATION = 7 # days

def generate_access_token(user):
    secret = current_app.config["SECRET_KEY"]

    raw_role = getattr(user, 'role', None)
    
    
    if hasattr(raw_role, 'name'):
        role_name = raw_role.name  # Extracts "admin" from the Role object
    else:
        role_name = raw_role or getattr(user, 'role_id', None)

    payload = {
        "user_id": getattr(user, 'user_id', getattr(user, 'id', None)),
        "role": role_name,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15)
    }
    
    return jwt.encode(payload, secret, algorithm="HS256")

def generate_refresh_token(user):
    payload = {
        "user_id": user.user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRATION)
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def verify_token(token):
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None