from flask import Blueprint, request, jsonify
from app import db
from app.utils.jwt_handler import verify_token
from app.models.user import User
from app.utils.jwt_handler import generate_access_token, generate_refresh_token

auth = Blueprint("auth", __name__)


@auth.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = generate_access_token(user)
    refresh_token = generate_refresh_token(user)

    return jsonify({"access_token": access_token, "refresh_token": refresh_token})


@auth.route("/api/logout", methods=["POST"])
def logout():
    return jsonify({"message": "User logged out successfully"})


@auth.route("/api/profile", methods=["GET"])
def profile():
    # Get Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    # Expect header: "Bearer <token>"
    try:
        token = auth_header.split(" ")[1]
    except IndexError:
        return jsonify({"error": "Invalid Authorization header"}), 401

    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 403

    # Optionally, return user info
    user = db.session.get(User, payload["user_id"])
    return jsonify(
        {"message": "Access granted", "user_id": user.user_id, "email": user.email}
    )


@auth.route("/api/refresh", methods=["POST"])
def refresh():
    """
    Refresh the access token using a refresh token.
    Expects JSON body: { "refresh_token": "<your_refresh_token>" }
    """
    data = request.get_json()
    if not data or "refresh_token" not in data:
        return jsonify({"error": "Missing refresh token"}), 400

    refresh_token = data["refresh_token"]
    payload = verify_token(refresh_token)

    if not payload:
        return jsonify({"error": "Invalid or expired refresh token"}), 403

    # Generate a new access token
    new_access_token = generate_access_token(payload["user_id"])
    return jsonify({"access_token": new_access_token})
