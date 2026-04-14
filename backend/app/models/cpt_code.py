from app import db

class CPTCode(db.Model):
    __tablename__ = "cpt_codes"

    cpt_code_id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100))
    default_price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    is_active = db.Column(db.Boolean, default=True)