from app import db

class Role(db.Model):
    __tablename__ = "roles"

    role_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)


def add_roles():
    roles = ["admin", "doctor", "nurse", "receptionist"]

    for role_name in roles:
        existing_role = Role.query.filter_by(name=role_name).first()
        if not existing_role:
            db.session.add(Role(name=role_name))

    db.session.commit()