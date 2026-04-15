from app import create_app, db
from app.models.user import User
from app.models.role import Role

app = create_app()

with app.app_context():
    # ---------------------------------------------------------
    #  ENSURE ROLES EXIST
    # ---------------------------------------------------------
    # Mapping to: 1: admin, 2: doctor, 3: nurse, 4: receptionist
    roles_mapping = {
        1: "admin", 
        2: "doctor", 
        3: "nurse", 
        4: "receptionist"
    }
    
    for r_id, r_name in roles_mapping.items():
        role = db.session.get(Role, r_id)
        if not role:
            db.session.add(Role(id=r_id, name=r_name))
            print(f"Role '{r_name}' (ID: {r_id}) created.")
        else:
            role.name = r_name
    db.session.commit()

    # ---------------------------------------------------------
    #  SEED ADMIN USER (Role ID: 1)
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
    #  SEED DOCTOR USER (Role ID: 2)
    # ---------------------------------------------------------
    doctor = User.query.filter_by(email="doctor@clinic.com").first()
    if not doctor:
        new_doctor = User(
            role_id=2,
            first_name="Gregory",
            last_name="House",
            email="doctor@clinic.com",
            phone="5559990000"
        )
        new_doctor.set_password("123")
        db.session.add(new_doctor)
        print("Doctor user created.")

    # ---------------------------------------------------------
    #  SEED RECEPTIONIST USER (Role ID: 4)
    # ---------------------------------------------------------
    recep = User.query.filter_by(email="receptionist@clinic.com").first()
    if not recep:
        new_recep = User(
            role_id=4,
            first_name="Recep",
            last_name="User",
            email="receptionist@clinic.com",
            phone="5557654321"
        )
        new_recep.set_password("123")
        db.session.add(new_recep)
        print("Receptionist user created.")

    db.session.commit()
   

    doc = User(
    role_id=3, # Assuming 3 is 'doctor' in your roles table
    email="doctor@clinic.com",
    first_name="Dr.",
    last_name="House"
)
doc.set_password("123")
db.session.add(doc)
print("Database sync complete!")
db.session.commit()