from flask import Blueprint, request, jsonify
from app.utils.decorators import require_auth, require_role


compat = Blueprint("compat", __name__, url_prefix="/api")


@compat.route("/admin/stats", methods=["GET"])
@require_auth
@require_role("admin")
def admin_stats():
    return jsonify(
        {
            "message": "Welcome, Admin. Here are the hospital analytics.",
            "stats": {
                "total_patients": 1250,
                "active_appointments": 45,
                "revenue_mtd": 15200.50,
            },
        }
    ), 200


@compat.route("/patient/<int:patient_id>/records", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "nurse")
def patient_records(patient_id: int):
    return jsonify(
        {
            "patient_id": patient_id,
            "history": [
                {
                    "date": "2024-01-10",
                    "diagnosis": "Hypertension",
                    "doctor": "Dr. Smith",
                },
                {
                    "date": "2023-11-05",
                    "diagnosis": "Common Cold",
                    "doctor": "Dr. Jones",
                },
            ],
            "message": "Accessing sensitive medical history...",
        }
    ), 200


@compat.route("/vitals", methods=["POST"])
@require_auth
@require_role("admin", "doctor")
def submit_vitals():
    return jsonify({"message": "Vitals saved to patient record."}), 201


@compat.route("/billing", methods=["POST"])
@require_auth
@require_role("admin", "receptionist")
def process_billing():
    data = request.get_json(silent=True) or {}
    return jsonify(
        {
            "message": "Billing information saved successfully!",
            "transaction_id": "TXN-99821",
            "carrier": data.get("carrierName"),
        }
    ), 201
