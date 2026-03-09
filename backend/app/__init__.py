import logging
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import config

# Initialize extensions (not yet bound to an app)
db = SQLAlchemy()


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
    from app.routes.patients import patients_bp

    app.register_blueprint(main)
    app.register_blueprint(patients_bp)

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
