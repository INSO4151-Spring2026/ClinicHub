from flask import Blueprint, request, jsonify, g
from app import db
from app.models.patient_vitals import PatientVitals
from app.models.patient import Patient
from app.utils.decorators import require_auth, require_role
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

vitals = Blueprint("vitals", __name__, url_prefix="/api/vitals")


def _to_float(val):
    try:
        return float(val) if val not in (None, "", "NaN") else None
    except (TypeError, ValueError):
        return None


def _to_int(val):
    try:
        return int(val) if val not in (None, "") else None
    except (TypeError, ValueError):
        return None


@vitals.route("", methods=["POST"])
@require_auth
@require_role("admin", "doctor")
def create_vitals():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request must be JSON"}), 400

        patient_id = data.get("patient_id")
        if not patient_id:
            return jsonify({"error": "patient_id is required"}), 400

        patient = db.session.get(Patient, patient_id)
        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        record = PatientVitals(
            patient_id=patient_id,
            recorded_by_user_id=g.current_user.user_id,
            recorded_at=datetime.now(timezone.utc),
            height_m=_to_float(data.get("height")),
            weight_kg=_to_float(data.get("weight")),
            bmi=_to_float(data.get("bmi")),
            bmi_category=data.get("bmi_category") or None,
            blood_pressure=data.get("bp") or None,
            temperature_c=_to_float(data.get("temperature")),
            pulse_bpm=_to_int(data.get("pulse")),
            respiratory_rate=_to_int(data.get("respiratory_rate")),
            o2_saturation=_to_float(data.get("o2_saturation")),
            pain_level=_to_int(data.get("pain_level")),
            head_circumference_cm=_to_float(data.get("head_circumference")),
        )

        db.session.add(record)
        db.session.commit()

        logger.info(f"Recorded vitals {record.vital_id} for patient {patient_id}")

        return jsonify({
            "message": "Vitals recorded successfully",
            "vitals": record.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error recording vitals: {e}")
        return jsonify({"error": "Failed to record vitals"}), 500


@vitals.route("", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "receptionist")
def list_vitals():
    try:
        patient_id = request.args.get("patient_id", type=int)
        if not patient_id:
            return jsonify({"error": "patient_id query parameter is required"}), 400

        records = (
            PatientVitals.query
            .filter_by(patient_id=patient_id)
            .order_by(PatientVitals.recorded_at.desc())
            .all()
        )

        return jsonify([r.to_dict() for r in records]), 200

    except Exception as e:
        logger.error(f"Error listing vitals for patient {patient_id}: {e}")
        return jsonify({"error": "Failed to retrieve vitals"}), 500
