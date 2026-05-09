from app import db, create_app
from app.models.patient import Patient
import random

app = create_app()
with app.app_context():
    print("Seeding 10,000 patients...")
    patients = []
    for i in range(10000):
        patients.append(Patient(
            first_name=f"Test_{i}",
            last_name="User",
            email=f"user{i}@stress.com",
            phone=f"555{random.randint(1000000, 9999999)}"
        ))
        if i % 1000 == 0:
            db.session.bulk_save_objects(patients)
            db.session.commit()
            patients = []
            print(f"Inserted {i}...")
    
    db.session.bulk_save_objects(patients)
    db.session.commit()
    print("Database Seeded Successfully.")