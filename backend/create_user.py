from app import create_app, db
from app.models.user import User
from app.models.role import Role

app = create_app()

with app.app_context():
    # ---------------------------------------------------------
    # ENSUREs ROLES EXIST
    # ---------------------------------------------------------
    roles = {1: "admin", 2: "receptionist"}
    for r_id, r_name in roles.items():
        role = db.session.get(Role, r_id)
        if not role:
            db.session.add(Role(id=r_id, name=r_name))
            print(f"Role '{r_name}' created.")
    db.session.commit()

    # ---------------------------------------------------------
    # SEED ADMIN USER
    # ---------------------------------------------------------
    admin = User.query.filter_by(email="admin@clinic.com").first()
    if not admin:
        new_admin = User(
            role_id=1,
            first_name="Admin",
            last_name="User",
            email="admin@clinic.com",
            phone="5551234567"
        )
        new_admin.set_password("123")
        db.session.add(new_admin)
        print("Admin user created.")

    # ---------------------------------------------------------
    # SEED RECEPTIONIST USER
    # ---------------------------------------------------------
    recep = User.query.filter_by(email="receptionist@clinic.com").first()
    if not recep:
        new_recep = User(
            role_id=2,
            first_name="Recep",
            last_name="User",
            email="receptionist@clinic.com",
            phone="5557654321"
        )
        new_recep.set_password("123")
        db.session.add(new_recep)
        print("Receptionist user created.")

    db.session.commit()
    print("Database sync complete!")