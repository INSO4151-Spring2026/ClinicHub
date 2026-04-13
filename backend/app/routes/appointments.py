"""
Appointment scheduling endpoints for ClinicHub.

RBAC summary:
  POST   /api/appointments        – admin, doctor, nurse, receptionist
  GET    /api/appointments        – admin, doctor, nurse, receptionist
  GET    /api/appointments/:id    – admin, doctor, nurse, receptionist
  PUT    /api/appointments/:id    – admin, doctor, nurse, receptionist
  DELETE /api/appointments/:id    – admin, doctor, receptionist
    (DELETE performs a soft-cancel by setting status='cancelled',
     preserving the record for audit / billing purposes.)
"""
from flask import Blueprint, request, jsonify, g
from app import db
from app.models.appointment import Appointment, VALID_STATUSES
from app.models.patient import Patient
from app.models.user import User
from app.utils.decorators import require_auth, require_role
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

appointments = Blueprint("appointments", __name__, url_prefix="/api/appointments")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_ISO_FORMAT = "%Y-%m-%dT%H:%M:%S"
_ISO_FORMAT_TZ = "%Y-%m-%dT%H:%M:%S%z"

# Sort fields allowed on the list endpoint
_VALID_SORT_FIELDS = {"appointment_id", "scheduled_start", "scheduled_end", "status", "created_at"}


def _parse_datetime(value: str):
    """
    Parse an ISO-8601 datetime string (with or without timezone offset).
    Returns a timezone-aware datetime (UTC) on success, or raises ValueError.

    Accepts:
      - "2026-04-01T09:00:00"          → treated as UTC
      - "2026-04-01T09:00:00+00:00"
      - "2026-04-01T09:00:00-05:00"
    """
    # Try with explicit timezone first
    try:
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        pass
    # Fallback: plain date-only strings are not allowed for scheduling
    raise ValueError(f"Cannot parse datetime: {value!r}. Use ISO-8601, e.g. '2026-04-01T09:00:00'")


# ---------------------------------------------------------------------------
# POST /api/appointments – Book a new appointment
# ---------------------------------------------------------------------------

@appointments.route("", methods=["POST"])
@require_auth
@require_role("admin", "doctor", "nurse", "receptionist")
def create_appointment():
    """
    Book a new appointment.

    Required JSON fields:
      patient_id        (int)  – must reference an existing patient
      provider_user_id  (int)  – must reference an existing, active user
      scheduled_start   (str)  – ISO-8601 datetime
      scheduled_end     (str)  – ISO-8601 datetime, must be after scheduled_start

    Optional JSON fields:
      cpt_id   (int)
      reason   (str, max 255)
      notes    (str)
      status   (str) – defaults to 'scheduled'

    Returns 201 with the created appointment on success.
    Returns 409 if the provider has a conflicting appointment in that slot.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        # --- Required fields ---
        required = ["patient_id", "provider_user_id", "scheduled_start", "scheduled_end"]
        for field in required:
            if data.get(field) is None:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # --- Parse & validate datetimes ---
        try:
            scheduled_start = _parse_datetime(data["scheduled_start"])
            scheduled_end = _parse_datetime(data["scheduled_end"])
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

        if scheduled_end <= scheduled_start:
            return jsonify({"error": "scheduled_end must be after scheduled_start"}), 400

        # --- Validate status if supplied ---
        status = data.get("status", "scheduled")
        if status not in VALID_STATUSES:
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"}), 400

        # --- Validate foreign keys ---
        if not db.session.get(Patient, data["patient_id"]):
            return jsonify({"error": "Patient not found"}), 404

        provider = db.session.get(User, data["provider_user_id"])
        if not provider or not provider.is_active:
            return jsonify({"error": "Provider not found or inactive"}), 404

        # --- Conflict detection ---
        conflict = Appointment.check_conflict(
            provider_user_id=data["provider_user_id"],
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
        )
        if conflict:
            return jsonify({
                "error": "Provider already has an appointment during that time slot",
                "conflict_appointment_id": conflict.appointment_id,
            }), 409

        # --- Create appointment ---
        appt = Appointment(
            patient_id=data["patient_id"],
            provider_user_id=data["provider_user_id"],
            cpt_id=data.get("cpt_id"),
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
            status=status,
            reason=data.get("reason"),
            notes=data.get("notes"),
        )
        db.session.add(appt)
        db.session.commit()

        logger.info(
            "Appointment %s created by user %s",
            appt.appointment_id,
            g.current_user.user_id,
        )

        return jsonify({"message": "Appointment created successfully", "appointment": appt.to_dict()}), 201

    except Exception as exc:
        db.session.rollback()
        logger.error("Error creating appointment: %s", exc)
        return jsonify({"error": "Failed to create appointment"}), 500


# ---------------------------------------------------------------------------
# GET /api/appointments – List appointments with pagination & filters
# ---------------------------------------------------------------------------

@appointments.route("", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "nurse", "receptionist")
def list_appointments():
    """
    List appointments with optional filters and pagination.

    Query parameters:
      page             (int, default 1)
      per_page         (int, default 10, max 100)
      patient_id       (int) – filter by patient
      provider_user_id (int) – filter by provider
      status           (str) – filter by status
      date_from        (str) – ISO-8601 date/datetime, inclusive lower bound on scheduled_start
      date_to          (str) – ISO-8601 date/datetime, exclusive upper bound on scheduled_start
      sort_by          (str, default 'scheduled_start') – field to sort on
      order            (str, 'asc'|'desc', default 'asc')

    Returns paginated list with metadata.
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 10, type=int), 100)

        # --- Optional filters ---
        patient_id = request.args.get("patient_id", type=int)
        provider_user_id = request.args.get("provider_user_id", type=int)
        status_filter = request.args.get("status", type=str)
        date_from = request.args.get("date_from", type=str)
        date_to = request.args.get("date_to", type=str)

        # --- Sorting ---
        sort_by = request.args.get("sort_by", "scheduled_start", type=str)
        order = request.args.get("order", "asc", type=str)
        if sort_by not in _VALID_SORT_FIELDS:
            sort_by = "scheduled_start"

        # --- Build query ---
        query = Appointment.query

        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)
        if provider_user_id:
            query = query.filter(Appointment.provider_user_id == provider_user_id)
        if status_filter:
            if status_filter not in VALID_STATUSES:
                return jsonify({"error": f"Invalid status filter. Must be one of: {', '.join(VALID_STATUSES)}"}), 400
            query = query.filter(Appointment.status == status_filter)
        if date_from:
            try:
                query = query.filter(Appointment.scheduled_start >= _parse_datetime(date_from))
            except ValueError as exc:
                return jsonify({"error": f"Invalid date_from: {exc}"}), 400
        if date_to:
            try:
                query = query.filter(Appointment.scheduled_start < _parse_datetime(date_to))
            except ValueError as exc:
                return jsonify({"error": f"Invalid date_to: {exc}"}), 400

        sort_col = getattr(Appointment, sort_by)
        query = query.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        items = [a.to_dict() for a in pagination.items]

        logger.info("Listed appointments – page %s, %s results", page, len(items))

        return jsonify({
            "appointments": items,
            "pagination": {
                "total": pagination.total,
                "pages": pagination.pages,
                "page": page,
                "per_page": per_page,
                "has_next": pagination.has_next,
                "has_prev": pagination.has_prev,
            },
        }), 200

    except Exception as exc:
        logger.error("Error listing appointments: %s", exc)
        return jsonify({"error": "Failed to retrieve appointments"}), 500


# ---------------------------------------------------------------------------
# GET /api/appointments/:id – Retrieve a single appointment
# ---------------------------------------------------------------------------

@appointments.route("/<int:appointment_id>", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "nurse", "receptionist")
def get_appointment(appointment_id):
    """Return a single appointment by its primary key."""
    try:
        appt = db.session.get(Appointment, appointment_id)
        if not appt:
            return jsonify({"error": "Appointment not found"}), 404

        logger.info("Retrieved appointment %s", appointment_id)
        return jsonify(appt.to_dict()), 200

    except Exception as exc:
        logger.error("Error retrieving appointment %s: %s", appointment_id, exc)
        return jsonify({"error": "Failed to retrieve appointment"}), 500


# ---------------------------------------------------------------------------
# PUT /api/appointments/:id – Modify an appointment
# ---------------------------------------------------------------------------

@appointments.route("/<int:appointment_id>", methods=["PUT"])
@require_auth
@require_role("admin", "doctor", "nurse", "receptionist")
def update_appointment(appointment_id):
    """
    Modify an existing appointment (partial update).

    Updatable fields (all optional):
      scheduled_start  (str) – ISO-8601 datetime
      scheduled_end    (str) – ISO-8601 datetime
      status           (str)
      reason           (str)
      notes            (str)
      cpt_id           (int|null)

    Rescheduling (changing start/end) re-runs conflict detection,
    excluding the appointment itself so it does not conflict with its
    current slot.

    A completed or cancelled appointment cannot be rescheduled; only
    notes/reason may be updated on such records.
    """
    try:
        appt = db.session.get(Appointment, appointment_id)
        if not appt:
            return jsonify({"error": "Appointment not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        # --- Status validation ---
        if "status" in data:
            if data["status"] not in VALID_STATUSES:
                return jsonify({"error": f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"}), 400

        # --- Determine effective start/end (may come from request or existing values) ---
        new_start = appt.scheduled_start
        new_end = appt.scheduled_end
        rescheduling = False

        if "scheduled_start" in data:
            try:
                new_start = _parse_datetime(data["scheduled_start"])
                rescheduling = True
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400

        if "scheduled_end" in data:
            try:
                new_end = _parse_datetime(data["scheduled_end"])
                rescheduling = True
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400

        if new_end <= new_start:
            return jsonify({"error": "scheduled_end must be after scheduled_start"}), 400

        # --- Conflict detection when rescheduling ---
        if rescheduling:
            # Block rescheduling of appointments that are already done
            if appt.status in ("completed", "cancelled", "no_show"):
                return jsonify({
                    "error": f"Cannot reschedule an appointment with status '{appt.status}'"
                }), 409

            conflict = Appointment.check_conflict(
                provider_user_id=appt.provider_user_id,
                scheduled_start=new_start,
                scheduled_end=new_end,
                exclude_id=appointment_id,
            )
            if conflict:
                return jsonify({
                    "error": "Provider already has an appointment during that time slot",
                    "conflict_appointment_id": conflict.appointment_id,
                }), 409

        # --- Apply updates ---
        appt.scheduled_start = new_start
        appt.scheduled_end = new_end

        if "status" in data:
            appt.status = data["status"]
        if "reason" in data:
            appt.reason = data["reason"]
        if "notes" in data:
            appt.notes = data["notes"]
        if "cpt_id" in data:
            appt.cpt_id = data["cpt_id"]

        db.session.commit()

        logger.info(
            "Appointment %s updated by user %s",
            appointment_id,
            g.current_user.user_id,
        )

        return jsonify({"message": "Appointment updated successfully", "appointment": appt.to_dict()}), 200

    except Exception as exc:
        db.session.rollback()
        logger.error("Error updating appointment %s: %s", appointment_id, exc)
        return jsonify({"error": "Failed to update appointment"}), 500


# ---------------------------------------------------------------------------
# DELETE /api/appointments/:id – Cancel an appointment (soft delete)
# ---------------------------------------------------------------------------

@appointments.route("/<int:appointment_id>", methods=["DELETE"])
@require_auth
@require_role("admin", "doctor", "receptionist")
def cancel_appointment(appointment_id):
    """
    Cancel an appointment by setting its status to 'cancelled'.

    This is a soft delete: the row is retained for audit and billing
    purposes. The slot is freed for rebooking once the status changes.

    Returns 409 if the appointment is already cancelled or completed.
    """
    try:
        appt = db.session.get(Appointment, appointment_id)
        if not appt:
            return jsonify({"error": "Appointment not found"}), 404

        if appt.status == "cancelled":
            return jsonify({"error": "Appointment is already cancelled"}), 409

        if appt.status == "completed":
            return jsonify({"error": "Cannot cancel a completed appointment"}), 409

        appt.status = "cancelled"
        db.session.commit()

        logger.info(
            "Appointment %s cancelled by user %s",
            appointment_id,
            g.current_user.user_id,
        )

        return jsonify({"message": "Appointment cancelled successfully", "appointment_id": appointment_id}), 200

    except Exception as exc:
        db.session.rollback()
        logger.error("Error cancelling appointment %s: %s", appointment_id, exc)
        return jsonify({"error": "Failed to cancel appointment"}), 500
