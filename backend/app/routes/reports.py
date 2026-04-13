from flask import Blueprint, request, jsonify
from app import db
from sqlalchemy import text 
from app.utils.decorators import require_auth, require_role
import logging

logger = logging.getLogger(__name__)

# Create the reports blueprint
reports = Blueprint("reports", __name__, url_prefix="/api/reports")

# -----------------------------------------------------------------------------
# GET /api/reports/daily-revenue
# -----------------------------------------------------------------------------
@reports.route("/daily-revenue", methods=["GET"])
@require_auth
@require_role("admin")
def get_daily_revenue():
    """
    Aggregates all payments for a specified date.
    Target response time: < 3 seconds.
    """
    date_str = request.args.get("date")

    if not date_str:
        return jsonify({"error": "Query parameter 'date' (YYYY-MM-DD) is required"}), 400

    try:
        # Raw SQL Query 
        # Using :target_date protects against SQL Injection
        query = text("""
            SELECT 
                COUNT(cpt_id) AS transactions,
                COALESCE(SUM(subtotal), 0.00) AS subtotal,
                COALESCE(SUM(tax), 0.00) AS tax,
                COALESCE(SUM(total), 0.00) AS revenue
            FROM cpt
            WHERE service_date = :target_date 
              AND status = 'paid';
        """)

        result = db.session.execute(query, {"target_date": date_str}).fetchone()

        logger.info(f"Daily revenue report generated for {date_str}")

        return jsonify({
            "date": date_str,
            "transaction_count": int(result.transactions),
            "data": {
                "subtotal": float(result.subtotal),
                "tax": float(result.tax),
                "total_revenue": float(result.revenue)
            }
        }), 200

    except Exception as e:
        logger.error(f"Failed to generate revenue report for {date_str}: {e}")
        return jsonify({"error": "Internal server error"}), 500