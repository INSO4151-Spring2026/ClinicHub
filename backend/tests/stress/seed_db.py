import sys
import os
import random
from datetime import date

# Ensure the root directory is in the path so we can find 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app import db, create_app
from app.models.patient import Patient

app = create_app()

def seed_stress_data():
    with app.app_context():
        print("--- Starting Database Seed (10,000 Records) ---")
        
        patients = []
        for i in range(10000):
            new_patient = Patient(
                first_name=f"StressTest_{i}",
                last_name="User",
                email=f"user_{i}_{random.randint(1000, 9999)}@stress.com",
                phone=f"555{random.randint(1000000, 9999999)}",
                dob=date(1990, 1, 1), # Fixes the NotNullViolation
            )
            patients.append(new_patient)
            
            # Batch commit every 1000 records for performance
            if len(patients) >= 1000:
                db.session.bulk_save_objects(patients)
                db.session.commit()
                print(f"Inserted {i+1} records...")
                patients = []

        # Final commit for remaining records
        if patients:
            db.session.bulk_save_objects(patients)
            db.session.commit()
            
        print("--- Seeding Complete! 10,000 Patients Created ---")

if __name__ == "__main__":
    seed_stress_data()