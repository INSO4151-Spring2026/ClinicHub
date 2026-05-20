from flask import Blueprint, request, jsonify
from app import db
from app.models.invoice import Invoice
from app.models.appointment import Appointment
from app.models.cpt import CPT
from app.models.insurance_plan import InsurancePlan
from app.utils.decorators import require_auth, require_role
from datetime import datetime, date
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

invoices = Blueprint("invoices", __name__, url_prefix="/api/invoices")


def _to_decimal(value) -> Decimal:
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal("0")


def _calculate_breakdown(total_amount: Decimal, plan: InsurancePlan | None):
    """Return (patient_amount, insurance_amount). Conservative defaults.

    Rules:
    - No plan => patient pays full.
    - Self-pay carrier => patient pays full.
    - If copay provided => patient pays min(copay, total), insurance pays the rest.
    - If copay missing => patient pays full (no assumptions).
    """

    if not plan:
        return total_amount, Decimal("0")

    carrier = (plan.carrier_name or "").lower()
    if "self" in carrier and "pay" in carrier:
        return total_amount, Decimal("0")

    if plan.copay is None:
        return total_amount, Decimal("0")

    copay = _to_decimal(plan.copay)
    patient_amount = copay if copay <= total_amount else total_amount
    insurance_amount = total_amount - patient_amount
    return patient_amount, insurance_amount


def _breakdown_dict(patient_id: int, cpt: CPT | None):
    if not cpt:
        return None

    plan = InsurancePlan.active_for_patient(patient_id)
    total_amount = _to_decimal(getattr(cpt, "total", None))
    patient_amount, insurance_amount = _calculate_breakdown(total_amount, plan)

    return {
        "total_amount": float(total_amount),
        "patient_amount": float(patient_amount),
        "insurance_amount": float(insurance_amount),
        "plan_id": plan.plan_id if plan else None,
    }


@invoices.route("", methods=["POST"])
@require_auth
@require_role("admin", "doctor", "receptionist")
def create_invoice():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request must be JSON"}), 400

        appointment_id = data.get("appointment_id")

        if not appointment_id:
            return jsonify({"error": "appointment_id is required"}), 400

        appointment = Appointment.query.get(appointment_id)

        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404

        if appointment.status != "completed":
            return jsonify({"error": "Appointment must be completed"}), 400

        if not appointment.cpt_id:
            return jsonify({"error": "No CPT associated with appointment"}), 400

        cpt = db.session.get(CPT, appointment.cpt_id)
        if not cpt:
            return jsonify({"error": "CPT record not found"}), 404

        # Prevent duplicate invoice
        existing = Invoice.query.filter_by(appointment_id=appointment_id).first()
        if existing:
            return jsonify({"error": "Invoice already exists"}), 409

        invoice = Invoice(
            appointment_id=appointment_id,
            cpt_id=appointment.cpt_id,
            patient_id=appointment.patient_id,
        )

        plan = InsurancePlan.active_for_patient(appointment.patient_id)
        if not plan:
            return (
                jsonify(
                    {
                        "error": "Patient must have an active insurance profile before billing"
                    }
                ),
                400,
            )

        carrier = (plan.carrier_name or "").lower()
        is_self_pay = "self" in carrier and "pay" in carrier
        if not is_self_pay and plan.copay is None:
            return (
                jsonify({"error": "Insurance copay is required before billing"}),
                400,
            )

        total_amount = _to_decimal(getattr(cpt, "total", None))
        patient_amount, insurance_amount = _calculate_breakdown(total_amount, plan)

        db.session.add(invoice)
        db.session.commit()

        logger.info(f"Created invoice {invoice.invoice_id}")

        return jsonify(
            {
                "message": "Invoice created successfully",
                "invoice": {
                    **invoice.to_dict(include_amount=True),
                    "breakdown": {
                        "total_amount": float(total_amount),
                        "patient_amount": float(patient_amount),
                        "insurance_amount": float(insurance_amount),
                        "plan_id": plan.plan_id if plan else None,
                    },
                },
            }
        ), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating invoice: {e}")
        return jsonify({"error": "Failed to create invoice"}), 500


@invoices.route("/<int:invoice_id>", methods=["PUT"])
@require_auth
@require_role("admin", "receptionist")
def update_invoice(invoice_id):
    try:
        invoice = Invoice.query.get(invoice_id)

        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404

        data = request.get_json()

        if not data or "status" not in data:
            return jsonify({"error": "Status is required"}), 400

        if data["status"] not in ["paid", "unpaid"]:
            return jsonify({"error": "Invalid status"}), 400

        cpt = db.session.get(CPT, invoice.cpt_id) if invoice.cpt_id else None

        if data["status"] == "paid":
            invoice.status = "paid"
            invoice.paid_at = datetime.utcnow()
            if cpt:
                cpt.status = "paid"
                cpt.billing_date = date.today()
        else:
            invoice.status = "unpaid"
            invoice.paid_at = None
            if cpt and cpt.status == "paid":
                cpt.status = "submitted"
                cpt.billing_date = None

        db.session.commit()

        return jsonify(
            {
                "message": "Invoice updated",
                "invoice": invoice.to_dict(include_amount=True),
            }
        ), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating invoice {invoice_id}: {e}")
        return jsonify({"error": "Failed to update invoice"}), 500


@invoices.route("/<int:invoice_id>/pay", methods=["PATCH"])
@require_auth
@require_role("admin", "receptionist")
def pay_invoice(invoice_id):
    """MVP payment flow: record an in-person payment by marking invoice paid.

    This is intentionally lightweight for demo/MVP. It does not integrate with a payment processor.
    """

    try:
        invoice = Invoice.query.get(invoice_id)

        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404

        if invoice.status != "paid":
            invoice.status = "paid"
            invoice.paid_at = datetime.utcnow()

            cpt = db.session.get(CPT, invoice.cpt_id) if invoice.cpt_id else None
            if cpt:
                cpt.status = "paid"
                cpt.billing_date = date.today()

            db.session.commit()

        return jsonify(
            {
                "message": "Invoice marked as paid",
                "invoice": invoice.to_dict(include_amount=True),
            }
        ), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error marking invoice {invoice_id} paid: {e}")
        return jsonify({"error": "Failed to mark invoice as paid"}), 500


@invoices.route("", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "receptionist")
def list_invoices():
    try:
        invoices_list = Invoice.query.all()

        return jsonify(
            [
                {
                    **invoice.to_dict(include_amount=True),
                    "breakdown": _breakdown_dict(
                        invoice.patient_id, db.session.get(CPT, invoice.cpt_id)
                    ),
                }
                for invoice in invoices_list
            ]
        ), 200

    except Exception as e:
        logger.error(f"Error listing invoices: {e}")
        return jsonify({"error": "Failed to retrieve invoices"}), 500


@invoices.route("/<int:invoice_id>", methods=["DELETE"])
@require_auth
@require_role("admin")
def delete_invoice(invoice_id):
    try:
        invoice = Invoice.query.get(invoice_id)

        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404

        db.session.delete(invoice)
        db.session.commit()

        return jsonify(
            {"message": "Invoice deleted permanently", "invoice_id": invoice_id}
        ), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting invoice {invoice_id}: {e}")
        return jsonify({"error": "Failed to delete invoice"}), 500
