from flask import Blueprint, request, jsonify, g
from app import db
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.utils.decorators import require_auth, require_role
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

medical_records = Blueprint("medical_records", __name__, url_prefix="/api/medical-records")


@medical_records.route("", methods=["POST"])
@require_auth
@require_role("admin", "doctor")
def create_medical_record():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request must be JSON"}), 400

        patient_id = data.get("patient_id")
        diagnosis = data.get("diagnosis", "").strip()
        treatment_plan = data.get("treatment_plan", "").strip()

        if not patient_id:
            return jsonify({"error": "patient_id is required"}), 400
        if not diagnosis:
            return jsonify({"error": "diagnosis is required"}), 400
        if not treatment_plan:
            return jsonify({"error": "treatment_plan is required"}), 400

        patient = db.session.get(Patient, patient_id)
        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        record = MedicalRecord(
            patient_id=patient_id,
            appointment_id=data.get("appointment_id"),
            provider_user_id=g.current_user.user_id,
            record_date=datetime.now(timezone.utc),
            diagnosis=diagnosis,
            treatment_plan=treatment_plan,
            notes=data.get("notes", "").strip() or None,
        )

        db.session.add(record)
        db.session.commit()

        logger.info(f"Created medical record {record.medical_record_id}")

        return jsonify({
            "message": "Medical record created successfully",
            "record": record.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating medical record: {e}")
        return jsonify({"error": "Failed to create medical record"}), 500


@medical_records.route("/<int:record_id>", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "receptionist")
def get_medical_record(record_id):
    try:
        record = db.session.get(MedicalRecord, record_id)
        if not record:
            return jsonify({"error": "Medical record not found"}), 404

        return jsonify({"record": record.to_dict()}), 200

    except Exception as e:
        logger.error(f"Error retrieving medical record {record_id}: {e}")
        return jsonify({"error": "Failed to retrieve medical record"}), 500


@medical_records.route("", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "receptionist")
def list_medical_records():
    try:
        patient_id = request.args.get("patient_id", type=int)
        if not patient_id:
            return jsonify({"error": "patient_id query parameter is required"}), 400

        records = (
            MedicalRecord.query
            .filter_by(patient_id=patient_id)
            .order_by(MedicalRecord.record_date.desc())
            .all()
        )

        return jsonify([r.to_dict() for r in records]), 200

    except Exception as e:
        logger.error(f"Error listing medical records for patient {patient_id}: {e}")
        return jsonify({"error": "Failed to retrieve medical records"}), 500


@medical_records.route("/<int:record_id>", methods=["PUT"])
@require_auth
@require_role("admin", "doctor")
def update_medical_record(record_id):
    try:
        record = db.session.get(MedicalRecord, record_id)
        if not record:
            return jsonify({"error": "Medical record not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request must be JSON"}), 400

        if "diagnosis" in data:
            record.diagnosis = data["diagnosis"].strip()
        if "treatment_plan" in data:
            record.treatment_plan = data["treatment_plan"].strip()
        if "notes" in data:
            record.notes = data["notes"].strip() or None

        db.session.commit()

        logger.info(f"Updated medical record {record_id}")

        return jsonify({
            "message": "Medical record updated",
            "record": record.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating medical record {record_id}: {e}")
        return jsonify({"error": "Failed to update medical record"}), 500
