from app.models import user
import jwt
from datetime import datetime, timedelta, timezone
from flask import current_app


ACCESS_TOKEN_EXPIRATION = 15 # minutes
REFRESH_TOKEN_EXPIRATION = 7 # days


# def generate_access_token(user): 
#     payload = {
#         "user_id": user.user_id,
#         "role": user.role_id,
#         "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRATION)
#     }
#     # Current_app.config["SECRET_KEY"] matches Node's JWT_SECRET
#     return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")
def generate_access_token(user):
    # HARDCODE temporarily to match Node exactly
    secret = "your-super-secret-key" 
    role_value = getattr(user, 'role', None) or getattr(user, 'role_id', None)
    
    payload = {
        "user_id": getattr(user, 'user_id', getattr(user, 'id', None)),
        "role": role_value,  # This will now be "admin"
        "exp": datetime.utcnow() + timedelta(hours=1)
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