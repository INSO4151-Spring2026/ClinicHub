from app import db
import bcrypt
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)

    role_id = db.Column(
        db.Integer,
        db.ForeignKey("roles.role_id", ondelete="RESTRICT"),
        nullable=False
    )

    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)

    email = db.Column(db.String(255), unique=True, nullable=False)

    password_hash = db.Column(db.LargeBinary(60), nullable=False)  # bcrypt hash

    phone = db.Column(db.String(20))

    is_active = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def set_password(self, password):
        # bcrypt.hashpw returns bytes
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash)