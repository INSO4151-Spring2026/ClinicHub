"""
Appointment model for ClinicHub.

Maps to the `appointments` table, which links a patient, a provider (user),
and an optional CPT billing entry to a scheduled time window.

Conflict detection (overlapping appointments for the same provider) is
enforced both at the application layer (see check_conflict()) and, when
running against PostgreSQL, by the `ex_appt_no_overlap` exclusion constraint
defined in schema.sql.
"""
from app import db
from datetime import datetime, timezone


# Allowed values for the `status` column
VALID_STATUSES = ("scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show")

# Appointments in these statuses do NOT block a provider's calendar
NON_BLOCKING_STATUSES = ("cancelled", "no_show")


class Appointment(db.Model):
    __tablename__ = "appointments"

    appointment_id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.patient_id", ondelete="CASCADE"),
        nullable=False,
    )
    provider_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    # Optional link to a CPT billing record created at the time of booking.
    # The FK constraint (→ cpt.cpt_id) is enforced by PostgreSQL via schema.sql;
    # no ORM-level ForeignKey is declared here because the Cpt model is not yet
    # implemented, which would break SQLite during testing.
    cpt_id = db.Column(db.Integer, nullable=True)
    scheduled_start = db.Column(db.DateTime(timezone=True), nullable=False)
    scheduled_end = db.Column(db.DateTime(timezone=True), nullable=False)
    # Valid transitions: scheduled → confirmed → in_progress → completed
    #                    any state → cancelled | no_show
    status = db.Column(db.String(30), nullable=False, default="scheduled")
    reason = db.Column(db.String(255))   # Chief complaint / visit reason
    notes = db.Column(db.Text)           # Free-text provider notes
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ------------------------------------------------------------------
    # Class-level helpers
    # ------------------------------------------------------------------

    @classmethod
    def check_conflict(cls, provider_user_id, scheduled_start, scheduled_end, exclude_id=None):
        """
        Return the first conflicting appointment for ``provider_user_id``
        within [scheduled_start, scheduled_end), or None if the slot is free.

        Two appointments conflict when their time ranges overlap and neither
        is in a non-blocking status (cancelled / no_show).

        Pass ``exclude_id`` when rescheduling so the appointment being updated
        is not compared against itself.
        """
        query = cls.query.filter(
            cls.provider_user_id == provider_user_id,
            cls.status.notin_(NON_BLOCKING_STATUSES),
            cls.scheduled_start < scheduled_end,
            cls.scheduled_end > scheduled_start,
        )
        if exclude_id is not None:
            query = query.filter(cls.appointment_id != exclude_id)
        return query.first()

    # ------------------------------------------------------------------
    # Instance helpers
    # ------------------------------------------------------------------

    def to_dict(self):
        """Serialize the appointment to a JSON-safe dictionary."""
        return {
            "appointment_id": self.appointment_id,
            "patient_id": self.patient_id,
            "provider_user_id": self.provider_user_id,
            "cpt_id": self.cpt_id,
            "scheduled_start": self.scheduled_start.isoformat() if self.scheduled_start else None,
            "scheduled_end": self.scheduled_end.isoformat() if self.scheduled_end else None,
            "status": self.status,
            "reason": self.reason,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return (
            f"<Appointment {self.appointment_id}: "
            f"patient={self.patient_id} "
            f"provider={self.provider_user_id} "
            f"start={self.scheduled_start}>"
        )
