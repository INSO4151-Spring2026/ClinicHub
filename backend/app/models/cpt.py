from app import db
from datetime import datetime, timezone

class CPT(db.Model):
    __tablename__ = "cpt"

    cpt_id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.patient_id"), nullable=False)
    cpt_code_id = db.Column(db.Integer, db.ForeignKey("cpt_codes.cpt_code_id"), nullable=False)
    service_date = db.Column(db.Date, nullable=False, index=True)
    billing_date = db.Column(db.Date)
    status = db.Column(db.String(30), nullable=False, default="draft")
    quantity = db.Column(db.Integer, nullable=False, default=1)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    tax = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    
    # Generated column: Database handles the calculation
    total = db.Column(db.Numeric(10, 2), db.Computed("subtotal + tax", persisted=True))
    
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "cpt_id": self.cpt_id,
            "patient_id": self.patient_id,
            "service_date": self.service_date.isoformat(),
            "status": self.status,
            "total": float(self.total)
        }