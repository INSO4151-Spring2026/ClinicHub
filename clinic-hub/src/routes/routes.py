from flask import Blueprint, request, jsonify
from .auth import generate_access_token 

api_bp = Blueprint('api', __name__)

# --- GLOBAL IN-MEMORY DATABASE ---
# This starts empty. It will only show dots once you POST an appointment.
appointments_db = []

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
    # Returns the actual data added via the POST route
    
    return jsonify(appointments_db), 200 

@api_bp.route('/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    
    # Create a new appointment object with a unique ID
    new_appt = {
        "id": len(appointments_db) + 1,
        "patient_name": data.get('patient_name'),
        "appointment_date": data.get('appointment_date'), # Expects "YYYY-MM-DD"
        "appointment_time": data.get('appointment_time'),
        "reason": data.get('reason')
    }
    
    # Save to the global list
    appointments_db.append(new_appt)
    
    return jsonify({
        "message": "Appointment confirmed!",
        "appointment": new_appt
    }), 201

@api_bp.route('/appointments/<int:appt_id>', methods=['DELETE'])
def delete_appointment(appt_id):
    global appointments_db
    original_length = len(appointments_db)
    appointments_db = [a for a in appointments_db if a.get('id') != appt_id]
    
    if len(appointments_db) < original_length:
        return jsonify({"message": "Appointment deleted successfully"}), 200
    return jsonify({"message": "Appointment not found"}), 404

# --- 4. VITALS SUBMISSION ---
@api_bp.route('/vitals', methods=['POST'])
def submit_vitals():
    data = request.json
    print(f"Vitals received: {data}")
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

# --- 6. CREATE NEW PATIENT ---
@api_bp.route('/patients', methods=['POST'])
def create_patient():
    data = request.json
    return jsonify({
        "message": "Patient created successfully!",
        "patientName": f"{data.get('first_name')} {data.get('last_name')}"
    }), 201

# --- 7. LOGIN ---
@api_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    users = {
        "admin@clinic.com": "Admin",
        "doctor@clinic.com": "Doctor",
        "receptionist@clinic.com": "Receptionist"
    }

    if email in users and password == "123":
        role = users[email]
        token = generate_access_token(1, role)
        return jsonify({"token": token, "role": role, "message": "Success"}), 200
    
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
        "data": {
            "subtotal": 1200.00,
            "tax": 84.00,
            "total_revenue": 1284.00
        }
    }), 200