from datetime import datetime

# -----------------------------------------------------------------------------
# Calculate totals for an invoice
# -----------------------------------------------------------------------------
def calculate_invoice_totals(subtotal, tax_rate=0.0):
    """
    Calculate tax and total amount

    Args:
        subtotal (float): base amount
        tax_rate (float): tax percentage (e.g., 0.07 for 7%)

    Returns:
        (tax, total)
    """
    tax = float(subtotal) * float(tax_rate)
    total = float(subtotal) + tax
    return round(tax, 2), round(total, 2)


# -----------------------------------------------------------------------------
# Generate invoice data from CPT record
# -----------------------------------------------------------------------------
def generate_invoice_from_cpt(cpt, tax_rate=0.0):
    """
    Build invoice data from a CPT object

    Args:
        cpt (CPT): CPT model instance
        tax_rate (float): tax rate

    Returns:
        dict: invoice data
    """
    if not cpt:
        raise ValueError("CPT record is required to generate invoice")

    subtotal = float(cpt.subtotal)

    tax, total = calculate_invoice_totals(subtotal, tax_rate)

    invoice_data = {
        "patient_id": cpt.patient_id,
        "cpt_id": cpt.cpt_id,
        "amount": subtotal,
        "tax": tax,
        "total": total,
        "status": "unpaid",
        "issued_date": datetime.utcnow()
    }

    return invoice_data


# -----------------------------------------------------------------------------
# Validate invoice status
# -----------------------------------------------------------------------------
def validate_invoice_status(status):
    """
    Ensure status is valid

    Allowed:
        unpaid, paid

    Returns:
        bool
    """
    valid_statuses = ["unpaid", "paid"]
    return status in valid_statuses


# -----------------------------------------------------------------------------
# Format invoice response (optional helper)
# -----------------------------------------------------------------------------
def format_invoice_response(invoice):
    """
    Convert invoice model to JSON-friendly dict
    """
    return {
        "invoice_id": invoice.invoice_id,
        "patient_id": invoice.patient_id,
        "cpt_id": invoice.cpt_id,
        "amount": float(invoice.amount),
        "tax": float(invoice.tax),
        "total": float(invoice.total),
        "status": invoice.status,
        "issued_date": invoice.issued_date.isoformat() if invoice.issued_date else None,
        "paid_date": invoice.paid_date.isoformat() if invoice.paid_date else None,
    }