from flask import Blueprint, request, jsonify
from app import db
from app.models.patient import Patient
from app.utils.decorators import require_auth, require_role
from datetime import datetime
from sqlalchemy import and_, or_
import logging

logger = logging.getLogger(__name__)

patients = Blueprint("patients", __name__, url_prefix="/api/patients")


# -----------------------------------------------------------------------------
# POST /api/patients - Create a new patient
# -----------------------------------------------------------------------------
@patients.route("", methods=["POST"])
@require_auth
@require_role("admin", "doctor", "nurse", "receptionist")
def create_patient():
    """
    Create a new patient record
    Expected JSON body:
    {
        "first_name": "John",
        "last_name": "Doe",
        "dob": "1980-01-15",
        "sex": "male",
        "email": "john.doe@example.com",
        "phone": "555-1234",
        "address": "123 Main St",
        "emergency_contact_name": "Jane Doe",
        "emergency_contact_phone": "555-5678"
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["first_name", "last_name", "dob"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Validate sex if provided
        valid_sex_values = ["male", "female", "other", "prefer_not_to_say"]
        if data.get("sex") and data["sex"] not in valid_sex_values:
            return jsonify(
                {
                    "error": f"Invalid sex value. Must be one of: {', '.join(valid_sex_values)}"
                }
            ), 400

        # Parse date of birth
        try:
            dob = datetime.strptime(data["dob"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify(
                {"error": "Invalid date format for dob. Use YYYY-MM-DD"}
            ), 400

        # Check if email already exists
        if data.get("email"):
            existing_patient = Patient.query.filter_by(email=data["email"]).first()
            if existing_patient:
                return jsonify({"error": "Patient with this email already exists"}), 409

        # Create new patient
        new_patient = Patient(
            first_name=data["first_name"],
            last_name=data["last_name"],
            dob=dob,
            sex=data.get("sex"),
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            emergency_contact_name=data.get("emergency_contact_name"),
            emergency_contact_phone=data.get("emergency_contact_phone"),
        )

        db.session.add(new_patient)
        db.session.commit()

        logger.info(f"Created new patient: {new_patient.patient_id}")

        return jsonify(
            {
                "message": "Patient created successfully",
                "patient": new_patient.to_dict(),
            }
        ), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating patient: {e}")
        return jsonify({"error": "Failed to create patient"}), 500


# -----------------------------------------------------------------------------
# GET /api/patients/:id - Get a specific patient by ID
# -----------------------------------------------------------------------------
@patients.route("/<int:patient_id>", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "nurse", "receptionist")
def get_patient(patient_id):
    """
    Retrieve a single patient by their ID
    """
    try:
        patient = db.session.get(Patient, patient_id)

        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        logger.info(f"Retrieved patient: {patient_id}")
        return jsonify(patient.to_dict()), 200

    except Exception as e:
        logger.error(f"Error retrieving patient {patient_id}: {e}")
        return jsonify({"error": "Failed to retrieve patient"}), 500


# -----------------------------------------------------------------------------
# PUT /api/patients/:id - Update a patient
# -----------------------------------------------------------------------------
@patients.route("/<int:patient_id>", methods=["PUT"])
@require_auth
@require_role("admin", "doctor", "nurse")
def update_patient(patient_id):
    """
    Update an existing patient record
    Expected JSON body (all fields optional):
    {
        "first_name": "John",
        "last_name": "Doe",
        "dob": "1980-01-15",
        "sex": "male",
        "email": "john.doe@example.com",
        "phone": "555-1234",
        "address": "123 Main St",
        "emergency_contact_name": "Jane Doe",
        "emergency_contact_phone": "555-5678"
    }
    """
    try:
        patient = db.session.get(Patient, patient_id)

        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        data = request.get_json()

        # Validate sex if provided
        if "sex" in data and data["sex"]:
            valid_sex_values = ["male", "female", "other", "prefer_not_to_say"]
            if data["sex"] not in valid_sex_values:
                return jsonify(
                    {
                        "error": f"Invalid sex value. Must be one of: {', '.join(valid_sex_values)}"
                    }
                ), 400

        # Check if email is being changed and if it already exists
        if "email" in data and data["email"] != patient.email:
            existing_patient = Patient.query.filter_by(email=data["email"]).first()
            if existing_patient:
                return jsonify({"error": "Patient with this email already exists"}), 409

        # Update fields if provided
        if "first_name" in data:
            patient.first_name = data["first_name"]
        if "last_name" in data:
            patient.last_name = data["last_name"]
        if "dob" in data:
            try:
                patient.dob = datetime.strptime(data["dob"], "%Y-%m-%d").date()
            except ValueError:
                return jsonify(
                    {"error": "Invalid date format for dob. Use YYYY-MM-DD"}
                ), 400
        if "sex" in data:
            patient.sex = data["sex"]
        if "email" in data:
            patient.email = data["email"]
        if "phone" in data:
            patient.phone = data["phone"]
        if "address" in data:
            patient.address = data["address"]
        if "emergency_contact_name" in data:
            patient.emergency_contact_name = data["emergency_contact_name"]
        if "emergency_contact_phone" in data:
            patient.emergency_contact_phone = data["emergency_contact_phone"]

        db.session.commit()

        logger.info(f"Updated patient: {patient_id}")

        return jsonify(
            {"message": "Patient updated successfully", "patient": patient.to_dict()}
        ), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating patient {patient_id}: {e}")
        return jsonify({"error": "Failed to update patient"}), 500


# -----------------------------------------------------------------------------
# DELETE /api/patients/:id - Delete a patient
# -----------------------------------------------------------------------------
@patients.route("/<int:patient_id>", methods=["DELETE"])
@require_auth
@require_role("admin")
def delete_patient(patient_id):
    """
    Delete a patient record
    Note: This will delete the patient record. In production, you may want to implement soft deletes instead.
    """
    try:
        patient = db.session.get(Patient, patient_id)

        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        db.session.delete(patient)
        db.session.commit()

        logger.info(f"Deleted patient: {patient_id}")

        return jsonify(
            {"message": "Patient deleted successfully", "patient_id": patient_id}
        ), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting patient {patient_id}: {e}")
        return jsonify({"error": "Failed to delete patient"}), 500


# -----------------------------------------------------------------------------
# GET /api/patients - List all patients with pagination and search
# -----------------------------------------------------------------------------
@patients.route("", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "nurse", "receptionist")
def list_patients():
    """
    List all patients with pagination and optional search
    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 10, max: 100)
    - search: Search term for first_name, last_name, or email
    - sort_by: Field to sort by (default: last_name)
    - order: Sort order - 'asc' or 'desc' (default: asc)
    """
    try:
        # Get pagination parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)

        # Limit per_page to prevent abuse
        if per_page > 100:
            per_page = 100

        # Get search parameter
        search = request.args.get("search", "", type=str)

        # Get sorting parameters
        sort_by = request.args.get("sort_by", "last_name", type=str)
        order = request.args.get("order", "asc", type=str)

        # Validate sort_by parameter
        valid_sort_fields = [
            "patient_id",
            "first_name",
            "last_name",
            "email",
            "dob",
            "created_at",
        ]
        if sort_by not in valid_sort_fields:
            sort_by = "last_name"

        # Build query
        query = Patient.query

        # Apply search filter if provided
        # Supports multi-term searches like "John Anderson" by requiring each term
        # to match (order-agnostic) across first_name / last_name / email.
        if search:
            terms = [t.strip(" ,;.\t\n\r") for t in search.split()]
            terms = [t for t in terms if t]

            if len(terms) == 1:
                search_filter = f"%{terms[0]}%"
                query = query.filter(
                    or_(
                        Patient.first_name.ilike(search_filter),
                        Patient.last_name.ilike(search_filter),
                        Patient.email.ilike(search_filter),
                    )
                )
            else:
                per_term_filters = []
                for term in terms:
                    term_filter = f"%{term}%"
                    per_term_filters.append(
                        or_(
                            Patient.first_name.ilike(term_filter),
                            Patient.last_name.ilike(term_filter),
                            Patient.email.ilike(term_filter),
                        )
                    )
                query = query.filter(and_(*per_term_filters))

        # Apply sorting
        sort_column = getattr(Patient, sort_by)
        if order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Execute paginated query
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        patients = [patient.to_dict() for patient in pagination.items]

        logger.info(f"Listed patients - page {page}, {len(patients)} results")

        return jsonify(
            {
                "patients": patients,
                "pagination": {
                    "total": pagination.total,
                    "pages": pagination.pages,
                    "page": page,
                    "per_page": per_page,
                    "has_next": pagination.has_next,
                    "has_prev": pagination.has_prev,
                },
            }
        ), 200

    except Exception as e:
        logger.error(f"Error listing patients: {e}")
        return jsonify({"error": "Failed to retrieve patients"}), 500
