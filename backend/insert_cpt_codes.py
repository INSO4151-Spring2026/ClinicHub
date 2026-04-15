from app import create_app, db
from app.models.cpt_code import CPTCode

app = create_app()

with app.app_context():

    codes = [
        ("99213", "Office visit - established patient", "Office Visit", 150),
        ("99214", "Office visit - detailed", "Office Visit", 200),
        ("99215", "Office visit - comprehensive", "Office Visit", 250),
        ("80053", "Comprehensive metabolic panel", "Lab Test", 45),
        ("85025", "Complete blood count", "Lab Test", 35),
        ("36415", "Routine venipuncture", "Lab Test", 25),
        ("90471", "Immunization administration", "Immunization", 30),
        ("90715", "Tetanus vaccine", "Immunization", 50),
    ]

    for code, desc, cat, price in codes:
        exists = CPTCode.query.filter_by(code=code).first()
        if not exists:
            new_code = CPTCode(
                code=code,
                description=desc,
                category=cat,
                default_price=price
            )
            db.session.add(new_code)

    db.session.commit()
    print("CPT codes seeded!")