from app import create_app, db
from app.models.role import add_roles


def _seed_dev_users():
    """Seed demo users for local development if they don't exist."""
    from app.models.user import User
    from app.models.role import Role

    users_data = [
        {
            "email": "admin@clinic.com",
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "phone": "5551234567",
        },
        {
            "email": "doctor@clinic.com",
            "first_name": "Gregory",
            "last_name": "House",
            "role": "doctor",
            "phone": "5559998888",
        },
        {
            "email": "nurse@clinic.com",
            "first_name": "Nurse",
            "last_name": "Joy",
            "role": "nurse",
            "phone": "5554445555",
        },
        {
            "email": "receptionist@clinic.com",
            "first_name": "Recep",
            "last_name": "User",
            "role": "receptionist",
            "phone": "5557654321",
        },
    ]

    created = 0
    for data in users_data:
        if User.query.filter_by(email=data["email"]).first():
            continue

        role = Role.query.filter_by(name=data["role"]).first()
        if not role:
            # Roles should exist via add_roles(), but be defensive.
            role = Role(name=data["role"])
            db.session.add(role)
            db.session.flush()

        user = User(
            role_id=role.role_id,
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            phone=data.get("phone"),
        )
        user.set_password("123")
        db.session.add(user)
        created += 1

    if created:
        db.session.commit()


app = create_app("development")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Creates tables if they don't exist yet
        add_roles()
        _seed_dev_users()
        app.logger.info("Starting ClinicHUB Flask server...")
    # Port 5002 keeps compatibility with the existing Node gateway proxy.
    app.run(port=5002)
