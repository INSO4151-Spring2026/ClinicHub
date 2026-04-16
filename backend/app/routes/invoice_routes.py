from flask import Blueprint, request, jsonify
from app import db
from app.models.invoice import Invoice
from app.models.appointment import Appointment
from app.utils.decorators import require_auth, require_role
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

invoices = Blueprint("invoices", __name__, url_prefix="/api/invoices")

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

        # Prevent duplicate invoice
        existing = Invoice.query.filter_by(appointment_id=appointment_id).first()
        if existing:
            return jsonify({"error": "Invoice already exists"}), 409

        invoice = Invoice(
            appointment_id=appointment_id,
            cpt_id=appointment.cpt_id,
            patient_id=appointment.patient_id
        )

        db.session.add(invoice)
        db.session.commit()

        logger.info(f"Created invoice {invoice.invoice_id}")

        return jsonify({
            "message": "Invoice created successfully",
            "invoice": invoice.to_dict(include_amount=True)
        }), 201

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

        if data["status"] == "paid":
            invoice.status = "paid"
            invoice.paid_at = datetime.utcnow()
        else:
            invoice.status = "unpaid"
            invoice.paid_at = None

        db.session.commit()

        return jsonify({
            "message": "Invoice updated",
            "invoice": invoice.to_dict(include_amount=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating invoice {invoice_id}: {e}")
        return jsonify({"error": "Failed to update invoice"}), 500

@invoices.route("", methods=["GET"])
@require_auth
@require_role("admin", "doctor", "receptionist")
def list_invoices():
    try:
        invoices_list = Invoice.query.all()

        return jsonify([
            invoice.to_dict(include_amount=True)
            for invoice in invoices_list
        ]), 200

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

        return jsonify({
            "message": "Invoice deleted permanently",
            "invoice_id": invoice_id
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting invoice {invoice_id}: {e}")
        return jsonify({"error": "Failed to delete invoice"}), 500