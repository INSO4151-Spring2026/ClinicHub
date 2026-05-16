"""CPT code endpoints for ClinicHub.

Provides read access to CPT codes seeded in the database.
"""

from flask import Blueprint, jsonify, request
from app.models.cpt_code import CPTCode
from app.utils.decorators import require_auth, require_role

cpt_codes = Blueprint("cpt_codes", __name__, url_prefix="/api/cpt_codes")


@cpt_codes.route("", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "nurse", "receptionist")
def list_cpt_codes():
    """List CPT codes.

    Query params:
      active (bool, default true) – when true, only returns active CPT codes

    Returns: [{ cpt_code_id, code, description, category, default_price, is_active }, ...]
    """
    active_only = request.args.get("active", "true").lower() not in ("false", "0", "no")

    query = CPTCode.query
    if active_only:
        query = query.filter(CPTCode.is_active.is_(True))

    items = query.order_by(CPTCode.category.asc(), CPTCode.code.asc()).all()

    return (
        jsonify(
            [
                {
                    "cpt_code_id": c.cpt_code_id,
                    "code": c.code,
                    "description": c.description,
                    "category": c.category,
                    "default_price": float(c.default_price)
                    if c.default_price is not None
                    else 0.0,
                    "is_active": bool(c.is_active),
                }
                for c in items
            ]
        ),
        200,
    )
