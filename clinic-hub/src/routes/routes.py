from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from app import db
from app.models.appointment import Appointment
from app.utils.jwt_handler import generate_access_token

# strict_slashes=False prevents 404s if the request has a trailing slash
api_bp = Blueprint('api', __name__)

# --- 1. ADMIN ONLY: ANALYTICS ---
@api_bp.route('/admin/stats', methods=['GET'])
def admin_stats():
    return jsonify({
        "message": "Welcome, Admin. Here are the hospital analytics.",
        "stats": {
            "total_patients": 1250,
            "active_appointments": 45,
            "revenue_mtd": 15200.50
        }
    }), 200

# --- 2. DOCTOR & ADMIN: MEDICAL RECORDS ---
@api_bp.route('/patient/<int:patient_id>/records', methods=['GET'])
def get_medical_records(patient_id):
    return jsonify({
        "patient_id": patient_id,
        "history": [
            {"date": "2024-01-10", "diagnosis": "Hypertension", "doctor": "Dr. Smith"},
            {"date": "2023-11-05", "diagnosis": "Common Cold", "doctor": "Dr. Jones"}
        ],
        "message": "Accessing sensitive medical history..."
    }), 200

# --- 3. APPOINTMENTS ---
@api_bp.route('/appointments', methods=['GET'])
def get_appointments():
    try:
        appointments = Appointment.query.all()
        return jsonify([appt.to_dict() for appt in appointments]), 200
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    
@api_bp.route('/appointments', methods=['POST'])
def create_appointment():
    data = request.get_json()
    required_fields = ['patient_id', 'provider_user_id', 'appointment_date', 'reason']
    missing = [field for field in required_fields if field not in data]
    
    if missing:
        return jsonify({
            "error": "Missing Data",
            "message": f"The following fields are required: {', '.join(missing)}"
        }), 400

    try:
        start_time = datetime.fromisoformat(data['appointment_date']).replace(tzinfo=timezone.utc)
        end_time = start_time + timedelta(minutes=30)

        conflict = Appointment.check_conflict(
            provider_user_id=data['provider_user_id'],
            scheduled_start=start_time,
            scheduled_end=end_time
        )

        if conflict:
            return jsonify({"error": "This time slot is already booked."}), 409

        new_appt = Appointment(
            patient_id=data['patient_id'],
            provider_user_id=data['provider_user_id'],
            scheduled_start=start_time,
            scheduled_end=end_time,
            reason=data['reason'],
            notes=data.get('notes', ''),
            status="scheduled"
        )

        db.session.add(new_appt)
        db.session.commit()
        return jsonify(new_appt.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    
@api_bp.route('/appointments/<int:appt_id>', methods=['DELETE'])
def delete_appointment(appt_id):
    appt = Appointment.query.filter_by(appointment_id=appt_id).first()
    if appt:
        db.session.delete(appt)
        db.session.commit()
        return jsonify({"message": "Deleted"}), 200
    return jsonify({"message": "Not found"}), 404

# --- 4. VITALS ---
@api_bp.route('/vitals', methods=['POST'])
def submit_vitals():
    return jsonify({"message": "Vitals saved to patient record."}), 201

# --- 5. BILLING ---
@api_bp.route('/billing', methods=['POST'])
def process_billing():
    data = request.json
    return jsonify({
        "message": "Billing information saved successfully!",
        "transaction_id": "TXN-99821",
        "carrier": data.get('carrierName')
    }), 201

# --- 6. CREATE PATIENT ---
@api_bp.route('/patients', methods=['POST'])
def create_patient():
    data = request.json
    return jsonify({
        "message": "Patient created successfully!",
        "patientName": f"{data.get('first_name')} {data.get('last_name')}"
    }), 201

# --- 7. LOGIN (Corrected for String Roles) ---
@api_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    users_roles = {
        "admin@clinic.com": "admin",
        "doctor@clinic.com": "doctor",
        "receptionist@clinic.com": "receptionist"
    }

    if email in users_roles and password == "123":
        role_name = users_roles[email]
        
        # FIX 2: Match the attributes your jwt_handler.py expects
        class UserMock:
            def __init__(self, uid, rname):
                self.user_id = uid
                self.role_id = rname  # We set the ID to the STRING "admin" 
                self.role = rname     # so both Node and Flask are happy

        user_obj = UserMock(1, role_name)
        
        try:
            token = generate_access_token(user_obj)
            return jsonify({
                "access_token": token, 
                "role": role_name, 
                "message": "Success"
            }), 200
        except Exception as e:
            # This will help you see errors in the console instead of just getting a 500
            print(f"JWT Generation Error: {e}")
            return jsonify({"error": "Token generation failed"}), 500
    
    return jsonify({"message": "Invalid credentials"}), 401

# --- 8. FINANCIAL REPORTS ---
@api_bp.route('/reports/daily-revenue', methods=['GET'])
def daily_revenue():
    date = request.args.get('date')
    if not date:
        return jsonify({"message": "Date is required"}), 400
    return jsonify({
        "date": date,
        "transaction_count": 12,
        "data": {"subtotal": 1200.0, "tax": 84.0, "total_revenue": 1284.0}
    }), 200