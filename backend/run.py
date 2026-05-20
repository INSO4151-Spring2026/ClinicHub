import os
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.engine.url import make_url

from app import create_app, db
from app.models.role import add_roles


def _seed_dev_users():
    """Seed demo users for local development if they don't exist."""
    from app.models.user import User
    from app.models.role import Role

    users_data = [
        {
            "email": "admin@clinic.com",
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "phone": "5551234567",
        },
        {
            "email": "doctor@clinic.com",
            "first_name": "Gregory",
            "last_name": "House",
            "role": "doctor",
            "phone": "5559998888",
        },
        {
            "email": "nurse@clinic.com",
            "first_name": "Nurse",
            "last_name": "Joy",
            "role": "nurse",
            "phone": "5554445555",
        },
        {
            "email": "receptionist@clinic.com",
            "first_name": "Recep",
            "last_name": "User",
            "role": "receptionist",
            "phone": "5557654321",
        },
    ]

    created = 0
    for data in users_data:
        if User.query.filter_by(email=data["email"]).first():
            continue

        role = Role.query.filter_by(name=data["role"]).first()
        if not role:
            # Roles should exist via add_roles(), but be defensive.
            role = Role(name=data["role"])
            db.session.add(role)
            db.session.flush()

        user = User(
            role_id=role.role_id,
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            phone=data.get("phone"),
        )
        user.set_password("123")
        db.session.add(user)
        created += 1

    if created:
        db.session.commit()


def _seed_cpt_codes():
    """Seed common CPT codes for local development if they don't exist."""

    from app.models.cpt_code import CPTCode

    codes = [
        ("99213", "Office visit - established patient", "Office Visit", 150),
        ("99214", "Office visit - detailed", "Office Visit", 200),
        ("99215", "Office visit - comprehensive", "Office Visit", 250),
        ("80053", "Comprehensive metabolic panel", "Lab Test", 45),
        ("85025", "Complete blood count", "Lab Test", 35),
        ("36415", "Routine venipuncture", "Lab Test", 25),
        ("90471", "Immunization administration", "Immunization", 30),
        ("90715", "Tetanus, diphtheria toxoids vaccine", "Immunization", 50),
    ]

    created = 0
    for code, desc, cat, price in codes:
        if CPTCode.query.filter_by(code=code).first():
            continue
        db.session.add(
            CPTCode(code=code, description=desc, category=cat, default_price=price)
        )
        created += 1

    if created:
        db.session.commit()


def _split_sql_statements(sql: str) -> list[str]:
    """Split a SQL script into executable statements.

    Handles semicolons inside strings, comments, and PostgreSQL dollar-quoted blocks.
    """

    statements: list[str] = []
    buf: list[str] = []

    in_single = False
    in_double = False
    in_line_comment = False
    in_block_comment = False
    dollar_tag: str | None = None

    i = 0
    while i < len(sql):
        ch = sql[i]
        nxt = sql[i + 1] if i + 1 < len(sql) else ""

        if in_line_comment:
            buf.append(ch)
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            buf.append(ch)
            if ch == "*" and nxt == "/":
                buf.append(nxt)
                in_block_comment = False
                i += 2
            else:
                i += 1
            continue

        if dollar_tag is not None:
            if sql.startswith(dollar_tag, i):
                buf.append(dollar_tag)
                i += len(dollar_tag)
                dollar_tag = None
            else:
                buf.append(ch)
                i += 1
            continue

        # Start of comments (only if not inside quotes)
        if not in_single and not in_double:
            if ch == "-" and nxt == "-":
                in_line_comment = True
                buf.append(ch)
                buf.append(nxt)
                i += 2
                continue
            if ch == "/" and nxt == "*":
                in_block_comment = True
                buf.append(ch)
                buf.append(nxt)
                i += 2
                continue

        # Dollar-quoted block start: $tag$ or $$
        if not in_single and not in_double and ch == "$":
            j = i + 1
            while j < len(sql) and (sql[j].isalnum() or sql[j] == "_"):
                j += 1
            if j < len(sql) and sql[j] == "$":
                dollar_tag = sql[i : j + 1]
                buf.append(dollar_tag)
                i = j + 1
                continue

        # Quote toggles
        if ch == "'" and not in_double:
            if in_single and nxt == "'":
                # Escaped single quote
                buf.append(ch)
                buf.append(nxt)
                i += 2
                continue
            in_single = not in_single
            buf.append(ch)
            i += 1
            continue

        if ch == '"' and not in_single:
            in_double = not in_double
            buf.append(ch)
            i += 1
            continue

        # Statement terminator
        if ch == ";" and not in_single and not in_double:
            stmt = "".join(buf).strip()
            if stmt:
                statements.append(stmt)
            buf = []
            i += 1
            continue

        buf.append(ch)
        i += 1

    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)
    return statements


def _postgres_table_exists(table_name: str) -> bool:
    return bool(
        db.session.execute(
            text("SELECT to_regclass(:tbl) IS NOT NULL"),
            {"tbl": f"public.{table_name}"},
        ).scalar()
    )


def _init_postgres_from_schema_sql_if_needed(app):
    """If DB is PostgreSQL and empty, apply backend/database/schema.sql."""

    if db.engine.dialect.name != "postgresql":
        return False

    # The schema.sql file isn't idempotent (CREATE TABLE + INSERT). Only run once.
    if _postgres_table_exists("roles"):
        return False

    schema_path = Path(__file__).resolve().parent / "database" / "schema.sql"
    schema_sql = schema_path.read_text(encoding="utf-8")
    statements = _split_sql_statements(schema_sql)

    app.logger.info(
        "Bootstrapping PostgreSQL DB from schema.sql (%d statements)", len(statements)
    )
    with db.engine.begin() as conn:
        for stmt in statements:
            if stmt.strip():
                conn.exec_driver_sql(stmt)
    return True


def _redact_db_uri(uri: str | None) -> str:
    if not uri:
        return ""
    try:
        url = make_url(uri)
        if url.password:
            url = url.set(password="***")
        return url.render_as_string(hide_password=False)
    except Exception:
        return "<unparseable database uri>"


app = create_app("development")

# Only set pool tuning options for server DBs (Postgres). SQLite will reject these.
_db_uri = (app.config.get("SQLALCHEMY_DATABASE_URI") or "").lower()
if not _db_uri.startswith("sqlite:"):
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_size": 100,  # Allow 100 simultaneous DB connections
        "max_overflow": 50,  # Allow 50 extra during heavy spikes
        "pool_timeout": 30,  # Users wait 30s for a slot before failing
    }

if __name__ == "__main__":
    with app.app_context():
        dialect = db.engine.dialect.name
        app.logger.info(
            "DB init: dialect=%s uri=%s",
            dialect,
            _redact_db_uri(app.config.get("SQLALCHEMY_DATABASE_URI")),
        )

        # If DATABASE_URL is set to Postgres, prefer schema.sql so the DB matches
        # backend/database/schema.sql (extensions, constraints, triggers, etc.).
        database_url = os.getenv("DATABASE_URL")
        if database_url and dialect == "postgresql":
            applied = _init_postgres_from_schema_sql_if_needed(app)
            if applied:
                app.logger.info("DB init: schema.sql applied")
            else:
                app.logger.info("DB init: schema.sql skipped (already initialized)")
            # Create any ORM tables that might exist outside schema.sql
            db.create_all()
        else:
            if not database_url:
                app.logger.info("DB init: DATABASE_URL not set; using ORM create_all()")
            elif dialect != "postgresql":
                app.logger.info(
                    "DB init: non-PostgreSQL dialect; using ORM create_all()"
                )
            db.create_all()  # Creates ORM tables if they don't exist yet

        add_roles()
        _seed_cpt_codes()
        _seed_dev_users()
        app.logger.info("Starting ClinicHUB Flask server...")
    # Port 5002 keeps compatibility with the existing Node gateway proxy.
    app.run(port=5002)
