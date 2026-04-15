from app import db
from datetime import datetime

class Invoice(db.Model):
    __tablename__ = "invoices"

    invoice_id = db.Column(db.Integer, primary_key=True)

    appointment_id = db.Column(
        db.Integer,
        db.ForeignKey("appointments.appointment_id"),
        nullable=False,
        unique=True  # matches your UNIQUE constraint
    )

    cpt_id = db.Column(
        db.Integer,
        db.ForeignKey("cpt.cpt_id"),
        nullable=False
    )

    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.patient_id"),
        nullable=False
    )

    status = db.Column(db.String(20), nullable=False, default="unpaid")

    issued_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    paid_at = db.Column(db.DateTime(timezone=True), nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self, include_amount=False):
        data = {
            "invoice_id": self.invoice_id,
            "appointment_id": self.appointment_id,
            "cpt_id": self.cpt_id,
            "patient_id": self.patient_id,
            "status": self.status,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None
        }
        return data