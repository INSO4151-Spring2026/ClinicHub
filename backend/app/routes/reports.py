from flask import Blueprint, request, jsonify
from decimal import Decimal
from datetime import datetime

from app.models.cpt import CPT
from app.models.insurance_plan import InsurancePlan
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

    Important:
    - Uses CPT.billing_date as the "transaction date" (set when payment is recorded).
        - Reports subtotal/total_revenue as the patient-paid amount (e.g., copay), matching Billing.
            (Tax is not modeled for copays, so it is reported as 0.)
        - Also returns CPT procedure totals and how much was covered by insurance to make the
            deductions visible in the report breakdown.
    Target response time: < 3 seconds.
    """
    date_str = request.args.get("date")

    if not date_str:
        return jsonify(
            {"error": "Query parameter 'date' (YYYY-MM-DD) is required"}
        ), 400

    try:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        cpts = (
            CPT.query.filter_by(status="paid")
            .filter(CPT.billing_date == target_date)
            .all()
        )

        patient_ids = {c.patient_id for c in cpts}
        plans_by_patient: dict[int, InsurancePlan] = {}
        if patient_ids:
            # There should be only one active plan per patient, but pick the most recently updated.
            plans = (
                InsurancePlan.query.filter(InsurancePlan.patient_id.in_(patient_ids))
                .filter(InsurancePlan.is_active.is_(True))
                .order_by(
                    InsurancePlan.patient_id.asc(), InsurancePlan.updated_at.desc()
                )
                .all()
            )
            for plan in plans:
                if plan.patient_id not in plans_by_patient:
                    plans_by_patient[plan.patient_id] = plan

        def _to_decimal(value) -> Decimal:
            try:
                return Decimal(str(value))
            except Exception:
                return Decimal("0")

        def _patient_paid_amount(
            total_amount: Decimal, plan: InsurancePlan | None
        ) -> Decimal:
            if not plan:
                return total_amount

            carrier = (plan.carrier_name or "").lower()
            if "self" in carrier and "pay" in carrier:
                return total_amount

            if plan.copay is None:
                return total_amount

            copay = _to_decimal(plan.copay)
            return copay if copay <= total_amount else total_amount

        # Collected (matches Billing)
        subtotal_sum = Decimal("0")
        tax_sum = Decimal("0")
        collected_sum = Decimal("0")

        # Procedure totals (from CPT)
        procedure_subtotal_sum = Decimal("0")
        procedure_tax_sum = Decimal("0")
        procedure_total_sum = Decimal("0")

        # Deductions
        insurance_covered_sum = Decimal("0")

        for cpt in cpts:
            procedure_subtotal_sum += _to_decimal(getattr(cpt, "subtotal", None))
            procedure_tax_sum += _to_decimal(getattr(cpt, "tax", None))
            total_amount = _to_decimal(getattr(cpt, "total", None))
            procedure_total_sum += total_amount

            patient_paid = _patient_paid_amount(
                total_amount, plans_by_patient.get(cpt.patient_id)
            )
            collected_sum += patient_paid
            subtotal_sum += patient_paid

            insurance_covered = total_amount - patient_paid
            if insurance_covered > 0:
                insurance_covered_sum += insurance_covered
            # Copays/self-pay are not split into subtotal/tax in this MVP.
            # Keep tax at 0 for clarity and consistency.

        logger.info(f"Daily revenue report generated for {date_str}")

        return jsonify(
            {
                "date": date_str,
                "transaction_count": int(len(cpts)),
                "data": {
                    "subtotal": float(subtotal_sum),
                    "tax": float(tax_sum),
                    "total_revenue": float(collected_sum),
                    # Procedure totals (CPT)
                    "procedure_subtotal": float(procedure_subtotal_sum),
                    "procedure_tax": float(procedure_tax_sum),
                    "procedure_total": float(procedure_total_sum),
                    # Deductions
                    "insurance_covered": float(insurance_covered_sum),
                },
            }
        ), 200

    except Exception as e:
        logger.error(f"Failed to generate revenue report for {date_str}: {e}")
        return jsonify({"error": "Internal server error"}), 500
