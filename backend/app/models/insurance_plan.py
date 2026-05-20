from __future__ import annotations

from datetime import datetime, timezone

from app import db


class InsurancePlan(db.Model):
    __tablename__ = "insurance_plans"

    plan_id = db.Column(db.Integer, primary_key=True)

    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.patient_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    carrier_name = db.Column(db.String(120), nullable=False)
    member_id = db.Column(db.String(80), nullable=False)
    group_id = db.Column(db.String(80), nullable=True)
    plan_type = db.Column(db.String(20), nullable=True)

    effective_date = db.Column(db.Date, nullable=True)
    copay = db.Column(db.Numeric(10, 2), nullable=True)

    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)

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

    def to_dict(self):
        return {
            "plan_id": self.plan_id,
            "patient_id": self.patient_id,
            "carrier_name": self.carrier_name,
            "member_id": self.member_id,
            "group_id": self.group_id,
            "plan_type": self.plan_type,
            "effective_date": self.effective_date.isoformat()
            if self.effective_date
            else None,
            "copay": float(self.copay) if self.copay is not None else None,
            "is_active": bool(self.is_active),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def active_for_patient(patient_id: int) -> "InsurancePlan | None":
        return (
            InsurancePlan.query.filter_by(patient_id=patient_id, is_active=True)
            .order_by(InsurancePlan.updated_at.desc())
            .first()
        )
