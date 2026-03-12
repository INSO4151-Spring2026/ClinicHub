from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():

    # Example admin user
    new_user = User(
        role_id=1,   # make sure role 1 exists in roles table
        first_name="Admin",
        last_name="User",
        email="admin@clinichub.com",
        phone="5551234567"
    )

    new_user.set_password("admin123")

    db.session.add(new_user)
    db.session.commit()

    print("User created successfully")