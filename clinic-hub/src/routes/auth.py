import jwt
from datetime import datetime, timedelta, timezone
# We import current_app to access the SECRET_KEY defined in app.py
from flask import current_app

def generate_access_token(user_id, role):
    """
    Generates a JWT token containing the user's ID and Role.
    The token will expire in 1 hour.
    """
    try:
        payload = {
            # exp: Expiration time (1 hour from now)
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            # iat: Issued at time
            "iat": datetime.now(timezone.utc),
            # Custom data for our middleware
            "user_id": user_id,
            "role": role
        }
        
        # Encode the payload using the Secret Key and HS256 algorithm
        token = jwt.encode(
            payload, 
            current_app.config.get("SECRET_KEY", "fallback_secret_if_missing"), 
            algorithm="HS256"
        )
        
        return token
        
    except Exception as e:
        print(f"Error generating token: {e}")
        return None