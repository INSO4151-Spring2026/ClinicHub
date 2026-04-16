from app import db
import bcrypt
from datetime import datetime, timezone

class User(db.Model):
    """
    User model for ClinicHub.
    Handles authentication and links to a specific role for RBAC.
    """
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)

    # Foreign key to the roles table
    role_id = db.Column(
        db.Integer, 
        db.ForeignKey("roles.role_id", ondelete="RESTRICT"), 
        nullable=False
    )

    # --- RELATIONSHIP DEFINITION ---
    # This is what allows 'user.role.name' to work in tests and routes.
    # It tells SQLAlchemy to fetch the related Role object automatically.
    role = db.relationship("Role", backref="users", lazy=True)

    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)

    email = db.Column(db.String(255), unique=True, nullable=False)

    password_hash = db.Column(db.LargeBinary(60), nullable=False)  # bcrypt hash

    phone = db.Column(db.String(20))

    is_active = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(
        db.DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ------------------------------------------------------------------
    # Authentication Helpers
    # ------------------------------------------------------------------

    def set_password(self, password):
        """Hashes the password using bcrypt and stores it as bytes."""
        if not password:
            raise ValueError("Password cannot be empty")
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    def check_password(self, password):
        """Verifies the password against the stored bcrypt hash."""
        if not self.password_hash or not password:
            return False
        # bcrypt.checkpw expects (plain_password, hashed_password)
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash)

    def to_dict(self):
        """Serialize the user object for JSON responses."""
        return {
            "user_id": self.user_id,
            "role_id": self.role_id,
            "role_name": self.role.name if self.role else None,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "is_active": self.is_active
        }

    def __repr__(self):
        return f"<User {self.user_id}: {self.email} ({self.role.name if self.role else 'No Role'})>"