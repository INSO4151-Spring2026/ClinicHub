from functools import wraps
from flask import request, jsonify, g
from app import db
from app.models.user import User
from app.models.role import Role
from app.utils.jwt_handler import verify_token


def require_auth(f):
    """
    Validates the Bearer token in the Authorization header.
    On success, stores the authenticated user in flask.g.current_user.
    Returns 401 if the token is missing, 403 if invalid or expired.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 403

        user = db.session.get(User, payload["user_id"])
        if not user or not user.is_active:
            return jsonify({"error": "User not found or inactive"}), 401

        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """
    Restricts the route to users whose role name is in `roles`.
    Must be used after @require_auth so that g.current_user is set.
    Returns 403 if the user's role is not permitted.

    Usage:
        @require_auth
        @require_role("admin", "doctor")
        def my_route():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = g.get("current_user")
            if not user:
                return jsonify({"error": "Not authenticated"}), 401

            # Uses the relationship directly. 
            role_name = user.role.name if user.role else None
            
            # Case-insensitive comparison
            if not role_name or not any(r.lower() == role_name.lower() for r in roles):
                return jsonify({"error": "Forbidden: Insufficient permissions"}), 403

            return f(*args, **kwargs)
        return decorated
    return decorator
