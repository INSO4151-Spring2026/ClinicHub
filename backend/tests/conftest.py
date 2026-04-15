"""
Shared fixtures for the ClinicHub test suite.

Uses SQLite in-memory database so no real PostgreSQL connection is needed.
Each test function gets a fresh database via function-scoped fixtures.
"""
import sys
import os
import pytest
from datetime import date, datetime, timezone, timedelta

# Ensure the backend root is on sys.path so imports resolve correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db as _db
from app.models.appointment import Appointment
from app.models.role import Role
from app.models.user import User
from app.models.patient import Patient
from app.utils.jwt_handler import generate_access_token, generate_refresh_token


# ---------------------------------------------------------------------------
# App / DB fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def app():
    """Create a Flask app configured for testing with an in-memory SQLite DB."""
    flask_app = create_app("testing")

    with flask_app.app_context():
        _db.create_all()
        _seed_roles()
        yield flask_app
        _db.session.remove()
        _db.engine.dispose()
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Flask test client."""
    return app.test_client()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _seed_roles():
    """Insert the four standard roles if they don't exist."""
    for name in ["admin", "doctor", "nurse", "receptionist"]:
        if not Role.query.filter_by(name=name).first():
            _db.session.add(Role(name=name))
    _db.session.commit()


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def admin_user(app):
    role = Role.query.filter_by(name="admin").first()
    user = User(
        role_id=role.role_id,
        first_name="Admin",
        last_name="Test",
        email="admin@test.com",
    )
    user.set_password("password123")
    _db.session.add(user)
    _db.session.commit()
    return user


@pytest.fixture
def doctor_user(app):
    role = Role.query.filter_by(name="doctor").first()
    user = User(
        role_id=role.role_id,
        first_name="Doctor",
        last_name="Test",
        email="doctor@test.com",
    )
    user.set_password("password123")
    _db.session.add(user)
    _db.session.commit()
    return user


@pytest.fixture
def nurse_user(app):
    role = Role.query.filter_by(name="nurse").first()
    user = User(
        role_id=role.role_id,
        first_name="Nurse",
        last_name="Test",
        email="nurse@test.com",
    )
    user.set_password("password123")
    _db.session.add(user)
    _db.session.commit()
    return user


@pytest.fixture
def receptionist_user(app):
    role = Role.query.filter_by(name="receptionist").first()
    user = User(
        role_id=role.role_id,
        first_name="Receptionist",
        last_name="Test",
        email="receptionist@test.com",
    )
    user.set_password("password123")
    _db.session.add(user)
    _db.session.commit()
    return user


# ---------------------------------------------------------------------------
# Token / header fixtures 
# ---------------------------------------------------------------------------

@pytest.fixture
def admin_token(app, admin_user):

    return generate_access_token(admin_user)


@pytest.fixture
def doctor_token(app, doctor_user):
    
    return generate_access_token(doctor_user)


@pytest.fixture
def nurse_token(app, nurse_user):
    
    return generate_access_token(nurse_user)


@pytest.fixture
def receptionist_token(app, receptionist_user):
   
    return generate_access_token(receptionist_user)


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def doctor_auth_headers(doctor_token):
    return {"Authorization": f"Bearer {doctor_token}"}


@pytest.fixture
def nurse_auth_headers(nurse_token):
    return {"Authorization": f"Bearer {nurse_token}"}


@pytest.fixture
def receptionist_auth_headers(receptionist_token):
    return {"Authorization": f"Bearer {receptionist_token}"}


# ---------------------------------------------------------------------------
# Patient fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_patient(app):
    patient = Patient(
        first_name="Jane",
        last_name="Doe",
        dob=date(1990, 5, 15),
        sex="female",
        email="jane.doe@test.com",
        phone="555-0001",
        address="123 Main St",
        emergency_contact_name="John Doe",
        emergency_contact_phone="555-0002",
    )
    _db.session.add(patient)
    _db.session.commit()
    return patient


# ---------------------------------------------------------------------------
# Appointment fixtures
# ---------------------------------------------------------------------------

_APPT_BASE = datetime(2026, 6, 1, 9, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def sample_appointment(app, sample_patient, doctor_user):
    """A single scheduled appointment (doctor → Jane Doe, 09:00–09:30 UTC on 2026-06-01)."""
    appt = Appointment(
        patient_id=sample_patient.patient_id,
        provider_user_id=doctor_user.user_id,
        scheduled_start=_APPT_BASE,
        scheduled_end=_APPT_BASE + timedelta(minutes=30),
        status="scheduled",
        reason="Annual check-up",
    )
    _db.session.add(appt)
    _db.session.commit()
    return appt