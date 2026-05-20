from app import db
from datetime import datetime, timezone


class MedicalRecord(db.Model):
    __tablename__ = "medical_records"

    medical_record_id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.patient_id", ondelete="CASCADE"),
        nullable=False,
    )
    appointment_id = db.Column(
        db.Integer,
        db.ForeignKey("appointments.appointment_id", ondelete="SET NULL"),
        nullable=True,
    )
    provider_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    record_date = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    diagnosis = db.Column(db.Text, nullable=False)
    treatment_plan = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text, nullable=True)

    patient = db.relationship("Patient", backref="medical_records", lazy=True)
    provider = db.relationship("User", backref="medical_records", lazy=True)

    def to_dict(self):
        return {
            "medical_record_id": self.medical_record_id,
            "patient_id": self.patient_id,
            "appointment_id": self.appointment_id,
            "provider_user_id": self.provider_user_id,
            "record_date": self.record_date.isoformat() if self.record_date else None,
            "diagnosis": self.diagnosis,
            "treatment_plan": self.treatment_plan,
            "notes": self.notes,
            "provider_name": (
                f"{self.provider.first_name} {self.provider.last_name}"
                if self.provider
                else None
            ),
            "patient_name": (
                f"{self.patient.first_name} {self.patient.last_name}"
                if self.patient
                else None
            ),
        }

    def __repr__(self):
        return f"<MedicalRecord {self.medical_record_id}: patient={self.patient_id}>"
