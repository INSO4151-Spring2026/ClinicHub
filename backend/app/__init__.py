import logging
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import config

from sqlalchemy import event
from sqlalchemy.engine import Engine

import sqlite3

# Initialize extensions (not yet bound to an app)
db = SQLAlchemy()


# SQLite does not enforce foreign keys (or ON DELETE CASCADE) unless explicitly enabled.
# Enable it per-connection so local-dev/test SQLite behaves closer to Postgres.
@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_app(config_name="development"):
    app = Flask(__name__)

    # Load config
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    db.init_app(app)
    CORS(app)

    # -------------------------------------------------------------------------
    # Logging setup
    # -------------------------------------------------------------------------
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(),  # prints to terminal
            logging.FileHandler("app.log"),  # saves to app.log file
        ],
    )
    app.logger.info("ClinicHUB Flask app initialized")

    # -------------------------------------------------------------------------
    # Register blueprints (routes)
    # -------------------------------------------------------------------------
    from app.routes import main
    from app.routes.auth_routes import auth
    from app.routes.patients import patients
    from app.routes.reports import reports
    from app.routes.appointments import appointments
    from app.routes.invoice_routes import invoices
    from app.routes.cpt_codes import cpt_codes
    from app.routes.compat import compat

    app.register_blueprint(main)
    app.register_blueprint(patients)
    app.register_blueprint(auth)
    app.register_blueprint(reports)
    app.register_blueprint(appointments)
    app.register_blueprint(invoices)
    app.register_blueprint(cpt_codes)
    app.register_blueprint(compat)

    # -------------------------------------------------------------------------
    # Basic error handlers
    # -------------------------------------------------------------------------
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden"}), 403

    return app
