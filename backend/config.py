import os
from dotenv import load_dotenv

load_dotenv()


def _sqlite_instance_uri() -> str:
    """Default local-dev DB (keeps setup lightweight; matches backend/instance/clinic.db)."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "instance", "clinic.db")
    # SQLAlchemy on Windows is happiest with forward slashes
    return f"sqlite:///{db_path.replace('\\\\', '/')}"


class Config:
    # Flask
    # Default is intentionally aligned with the Node gateway's JWT verification.
    # Override in real deployments via SECRET_KEY env var.
    SECRET_KEY = os.getenv("SECRET_KEY") or "your-super-secret-key"
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    # Database
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "clinichub")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    DATABASE_URL = os.getenv("DATABASE_URL") or None
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or (
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(Config):
    DEBUG = True
    # If DATABASE_URL isn't provided, default to local SQLite.
    SQLALCHEMY_DATABASE_URI = Config.DATABASE_URL or _sqlite_instance_uri()


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    # Change this to use the PostgreSQL URI from the base Config class
    # SQLALCHEMY_DATABASE_URI = Config.SQLALCHEMY_DATABASE_URI
    # SECRET_KEY = "test-secret-key-that-is-long-enough-for-hs256"
    # SECRET_KEY = "clinic-hub-secret-2026"  # CHANGE THIS
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"  # for unit tests


# Active config based on environment
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
