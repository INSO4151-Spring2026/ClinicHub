from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    db.create_all()  # Make sure tables exist

    # Create admin user
    user = User(username="admin")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()

    print("Admin user created successfully!")