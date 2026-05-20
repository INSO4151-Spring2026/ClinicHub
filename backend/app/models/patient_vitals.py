from app import db
from datetime import datetime, timezone


class PatientVitals(db.Model):
    __tablename__ = "patient_vitals"

    vital_id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.patient_id", ondelete="CASCADE"),
        nullable=False,
    )
    recorded_by_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
    )
    recorded_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    height_m = db.Column(db.Numeric(5, 2), nullable=True)
    weight_kg = db.Column(db.Numeric(5, 2), nullable=True)
    bmi = db.Column(db.Numeric(5, 2), nullable=True)
    bmi_category = db.Column(db.String(20), nullable=True)
    blood_pressure = db.Column(db.String(20), nullable=True)
    temperature_c = db.Column(db.Numeric(4, 1), nullable=True)
    pulse_bpm = db.Column(db.Integer, nullable=True)
    respiratory_rate = db.Column(db.Integer, nullable=True)
    o2_saturation = db.Column(db.Numeric(4, 1), nullable=True)
    pain_level = db.Column(db.SmallInteger, nullable=True)
    head_circumference_cm = db.Column(db.Numeric(5, 1), nullable=True)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    recorder = db.relationship("User", backref="recorded_vitals", lazy=True)
    patient = db.relationship("Patient", backref="vitals", lazy=True)

    def to_dict(self):
        def _f(val):
            return float(val) if val is not None else None

        return {
            "vital_id": self.vital_id,
            "patient_id": self.patient_id,
            "recorded_by_user_id": self.recorded_by_user_id,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
            "height_m": _f(self.height_m),
            "weight_kg": _f(self.weight_kg),
            "bmi": _f(self.bmi),
            "bmi_category": self.bmi_category,
            "blood_pressure": self.blood_pressure,
            "temperature_c": _f(self.temperature_c),
            "pulse_bpm": self.pulse_bpm,
            "respiratory_rate": self.respiratory_rate,
            "o2_saturation": _f(self.o2_saturation),
            "pain_level": self.pain_level,
            "head_circumference_cm": _f(self.head_circumference_cm),
            "recorder_name": (
                f"{self.recorder.first_name} {self.recorder.last_name}"
                if self.recorder
                else None
            ),
        }

    def __repr__(self):
        return f"<PatientVitals {self.vital_id}: patient={self.patient_id}>"
