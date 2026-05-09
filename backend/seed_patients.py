"""Seed dummy patients for local development.

Usage (from repo root):
  python backend/seed_patients.py --count 200

Notes:
- Idempotent per email prefix: it will skip emails that already exist.
- Uses the same database configured for the Flask app.
"""

from __future__ import annotations

import argparse
import random
from datetime import date

from app import create_app, db
from app.models.patient import Patient


FIRST_NAMES = [
    "James",
    "Mary",
    "John",
    "Patricia",
    "Robert",
    "Jennifer",
    "Michael",
    "Linda",
    "William",
    "Elizabeth",
    "David",
    "Barbara",
    "Richard",
    "Susan",
    "Joseph",
    "Jessica",
    "Thomas",
    "Sarah",
    "Charles",
    "Karen",
    "Daniel",
    "Nancy",
    "Matthew",
    "Lisa",
    "Anthony",
    "Betty",
    "Mark",
    "Margaret",
    "Donald",
    "Sandra",
    "Steven",
    "Ashley",
    "Paul",
    "Kimberly",
    "Andrew",
    "Emily",
    "Joshua",
    "Donna",
    "Kenneth",
    "Michelle",
]

LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
]

SEX_VALUES = ["male", "female", "other", "prefer_not_to_say"]


def _random_dob(*, min_year: int, max_year: int) -> date:
    year = random.randint(min_year, max_year)
    month = random.randint(1, 12)
    # Keep days valid for all months.
    day = random.randint(1, 28)
    return date(year, month, day)


def seed_patients(
    *, count: int, email_prefix: str, min_year: int, max_year: int
) -> int:
    created = 0

    # Preload existing emails for this prefix to make seeding fast and idempotent.
    existing_emails = {
        row[0]
        for row in db.session.query(Patient.email)
        .filter(Patient.email.ilike(f"{email_prefix}%"))
        .all()
        if row[0]
    }

    for i in range(1, count + 1):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        dob = _random_dob(min_year=min_year, max_year=max_year)

        email = f"{email_prefix}{i}@example.com"
        if email in existing_emails:
            continue

        patient = Patient(
            first_name=first_name,
            last_name=last_name,
            dob=dob,
            sex=random.choice(SEX_VALUES),
            email=email,
            phone=f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            address=f"{random.randint(1, 9999)} Main St",
            emergency_contact_name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            emergency_contact_phone=f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
        )

        db.session.add(patient)
        created += 1

        # Commit in batches to keep memory usage down.
        if created and created % 200 == 0:
            db.session.commit()

    db.session.commit()
    return created


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed dummy patients")
    parser.add_argument(
        "--count", type=int, default=200, help="How many patients to create"
    )
    parser.add_argument(
        "--email-prefix",
        type=str,
        default="dummy.patient+",
        help="Email prefix used for idempotency (e.g. dummy.patient+)",
    )
    parser.add_argument("--min-year", type=int, default=1940, help="Minimum birth year")
    parser.add_argument("--max-year", type=int, default=2018, help="Maximum birth year")
    args = parser.parse_args()

    if args.count < 1:
        raise SystemExit("--count must be >= 1")
    if args.min_year > args.max_year:
        raise SystemExit("--min-year must be <= --max-year")

    app = create_app("development")
    with app.app_context():
        db.create_all()
        created = seed_patients(
            count=args.count,
            email_prefix=args.email_prefix,
            min_year=args.min_year,
            max_year=args.max_year,
        )

    print(f"Seeded {created} patients (prefix={args.email_prefix!r}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
