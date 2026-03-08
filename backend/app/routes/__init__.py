from flask import Blueprint, jsonify
from app import db
import logging

logger = logging.getLogger(__name__)

main = Blueprint("main", __name__)

# -----------------------------------------------------------------------------
# Health check route
# Verifies the API is running and the database connection is working
# -----------------------------------------------------------------------------
@main.route("/api/health", methods=["GET"])
def health_check():
    try:
        # Attempt a simple database query to verify connection
        db.session.execute(db.text("SELECT 1"))
        logger.info("Health check passed - database connection successful")
        return jsonify({
            "status": "ok",
            "message": "ClinicHUB API is running",
            "database": "connected"
        }), 200
    except Exception as e:
        logger.error(f"Health check failed - database connection error: {e}")
        return jsonify({
            "status": "error",
            "message": "Database connection failed",
            "database": "disconnected"
        }), 500