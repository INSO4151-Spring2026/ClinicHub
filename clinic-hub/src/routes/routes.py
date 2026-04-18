from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from app import db
from app.models.appointment import Appointment
from app.models.patient import Patient 
from app.utils.jwt_handler import generate_access_token

# Blueprint definition
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

# --- 6. PATIENTS  ---
@api_bp.route('/patients', methods=['GET'])
def list_patients():
    """Returns a real list of patients from the DB."""
    patients = Patient.query.all()
    return jsonify([{
        "patient_id": p.patient_id,
        "first_name": p.first_name,
        "last_name": p.last_name,
        "email": p.email,
        "phone": p.phone
    } for p in patients]), 200

@api_bp.route('/patients/<int:patient_id>', methods=['GET'])
def get_patient(patient_id):
    try:
        patient = Patient.query.get(patient_id)

        if not patient:
            return jsonify({"message": "Patient not found"}), 404

        return jsonify({
            "patient_id": patient.patient_id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "dob": patient.dob.strftime('%Y-%m-%d') if patient.dob else None,
            "sex": patient.sex,
            "email": patient.email,
            "phone": patient.phone,
            "address": patient.address,
            "emergency_contact_name": patient.emergency_contact_name,
            "emergency_contact_phone": patient.emergency_contact_phone
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/patients', methods=['POST'])
def create_patient():
    """Creates a real patient record in the DB."""
    data = request.json
    try:
        # Convert string dob to date object
        dob_obj = datetime.strptime(data['dob'], '%Y-%m-%d').date() if 'dob' in data else None
        
        new_patient = Patient(
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            dob=dob_obj,
            sex=data.get('sex'),
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            emergency_contact_name=data.get('emergency_contact_name'),
            emergency_contact_phone=data.get('emergency_contact_phone')
        )
        db.session.add(new_patient)
        db.session.commit()
        
        return jsonify({
            "message": "Patient created successfully!",
            "patient_id": new_patient.patient_id,
            "patientName": f"{new_patient.first_name} {new_patient.last_name}"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# --- 7. LOGIN ---
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
        
        class RoleMock:
            def __init__(self, name):
                self.name = name

        class UserMock:
            def __init__(self, uid, rname):
                self.user_id = uid
                self.role = RoleMock(rname)

        user_obj = UserMock(1, role_name)
        
        try:
            token = generate_access_token(user_obj)
            return jsonify({
                "access_token": token, 
                "role": role_name, 
                "message": "Success"
            }), 200
        except Exception as e:
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