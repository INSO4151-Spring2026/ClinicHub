from flask import Blueprint, request, jsonify
from .auth import generate_access_token

api_bp = Blueprint('api', __name__)

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # 1. VALIDATION LOGIC
    if email == "admin@clinic.com" and password == "123":
        user_id = 1
        role = "Admin"
    elif email == "doctor@clinic.com" and password == "123":
        user_id = 2
        role = "Doctor"
    elif email == "receptionist@clinic.com" and password == "123":
        user_id = 3
        role = "Receptionist"
    else:
        return jsonify({"message": "Invalid email or password"}), 401

    # 2. GENERATE THE TOKEN
    token = generate_access_token(user_id, role)

    # 3. RETURN TO REACT
    return jsonify({
        "token": token,
        "role": role,
        "message": "Login successful"
    }), 200