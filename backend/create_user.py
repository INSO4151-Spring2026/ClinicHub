from app import create_app, db
from app.models.user import User
from app.models.role import Role

app = create_app()

with app.app_context():
    # ---------------------------------------------------------
    # ENSURE ROLES EXIST
    # ---------------------------------------------------------
    # Mapping based on DB: 1:admin, 2:doctor, 3:nurse, 4:receptionist
    roles_to_seed = {
        1: "admin", 
        2: "doctor", 
        3: "nurse", 
        4: "receptionist"
    }
    
    for r_id, r_name in roles_to_seed.items():
        # Using role_id to match your model's primary key name
        role = db.session.get(Role, r_id)
        if not role:
            db.session.add(Role(role_id=r_id, name=r_name))
            print(f"Role '{r_name}' created.")
    
    db.session.commit()

    # ---------------------------------------------------------
    # 2. SEED USERS 
    # ---------------------------------------------------------
    users_data = [
        {
            "email": "admin@clinic.com",
            "first_name": "Admin",
            "last_name": "User",
            "role_id": 1,
            "phone": "5551234567"
        },
        {
            "email": "doctor@clinic.com",
            "first_name": "Gregory",
            "last_name": "House",
            "role_id": 2,
            "phone": "5559998888"
        },
        {
            "email": "nurse@clinic.com",
            "first_name": "Nurse",
            "last_name": "Joy",
            "role_id": 3,
            "phone": "5554445555"
        },
        {
            "email": "receptionist@clinic.com",
            "first_name": "Recep",
            "last_name": "User",
            "role_id": 4,
            "phone": "5557654321"
        }
    ]

    for data in users_data:
        user_exists = User.query.filter_by(email=data["email"]).first()
        
        if not user_exists:
            new_user = User(
                role_id=data["role_id"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                email=data["email"],
                phone=data.get("phone")
            )
            new_user.set_password("123")
            db.session.add(new_user)
            print(f"User created: {data['email']} ({data['first_name']})")
        else:
            print(f"User already exists: {data['email']}")

    db.session.commit()
    print("\nDatabase sync complete!")