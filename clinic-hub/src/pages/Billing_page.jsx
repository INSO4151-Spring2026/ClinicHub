import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DollarSign, AlertCircle, CheckCircle, RefreshCcw } from "lucide-react";

function Billing_page() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      navigate("/login");
      return null;
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Express 404 pages come back as HTML; avoid dumping that into the UI.
      const looksLikeHtml =
        typeof text === "string" &&
        text.trimStart().startsWith("<!DOCTYPE html>");
      data = {
        message: looksLikeHtml
          ? `Request failed (HTTP ${res.status}). Is the Node gateway up-to-date/restarted?`
          : text,
      };
    }
    return { ok: res.ok, status: res.status, data };
  };

  const loadData = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const [apptRes, invRes] = await Promise.all([
        fetchJson("http://localhost:5000/api/appointments?per_page=100", {
          method: "GET",
        }),
        fetchJson("http://localhost:5000/api/invoices", { method: "GET" }),
      ]);

      if (!apptRes || !invRes) return;

      if (!apptRes.ok) {
        setError(
          apptRes.data?.message ||
            apptRes.data?.error ||
            "Failed to load appointments.",
        );
        return;
      }

      if (!invRes.ok) {
        setError(
          invRes.data?.message ||
            invRes.data?.error ||
            "Failed to load invoices.",
        );
        return;
      }

      const appts = Array.isArray(apptRes.data)
        ? apptRes.data
        : Array.isArray(apptRes.data?.appointments)
          ? apptRes.data.appointments
          : [];

      const invs = Array.isArray(invRes.data) ? invRes.data : [];

      setAppointments(appts);
      setInvoices(invs);
    } catch {
      setError("Connection failed. Is the Node server running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eligibleAppointments = useMemo(() => {
    const invoiced = new Set(invoices.map((i) => i.appointment_id));
    return appointments
      .filter((a) => Boolean(a?.cpt_id))
      .filter((a) => a?.status !== "cancelled" && a?.status !== "no_show")
      .filter((a) => !invoiced.has(a?.appointment_id));
  }, [appointments, invoices]);

  const appointmentById = useMemo(() => {
    return new Map(appointments.map((a) => [a.appointment_id, a]));
  }, [appointments]);

  const badgeForStatus = (status) => {
    if (status === "paid") return "badge badge-green";
    if (status === "unpaid") return "badge badge-yellow";
    return "badge badge-gray";
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (creating || !selectedAppointmentId) return;

    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const apptId = Number(selectedAppointmentId);
      const appt = appointmentById.get(apptId);

      // Guardrail: don't change appointment status if billing is guaranteed to fail.
      // Billing now requires an active insurance profile (including Self-Pay plan).
      if (appt?.patient_id) {
        const planRes = await fetchJson(
          `http://localhost:5000/api/patients/${appt.patient_id}/plan`,
          { method: "GET" },
        );

        if (!planRes) return;

        if (!planRes.ok) {
          setError(
            planRes.data?.error ||
              planRes.data?.message ||
              "Could not verify the patient's insurance profile.",
          );
          return;
        }

        const plan = planRes.data?.plan;
        if (!plan) {
          setError(
            `Patient ${appt.patient_id} must have an active insurance profile before billing. Add one in Plans.`,
          );
          return;
        }

        const carrier = String(plan?.carrier_name || "").toLowerCase();
        const isSelfPay = carrier.includes("self") && carrier.includes("pay");
        if (
          !isSelfPay &&
          (plan?.copay === null ||
            plan?.copay === undefined ||
            plan?.copay === "")
        ) {
          setError(
            `Patient ${appt.patient_id} insurance profile is missing a copay. Add it in the patient's profile before billing.`,
          );
          return;
        }
      }

      // Backend requires appointment.status === 'completed' to invoice.
      if (appt && appt.status !== "completed") {
        const updateRes = await fetchJson(
          `http://localhost:5000/api/appointments/${apptId}`,
          {
            method: "PUT",
            body: JSON.stringify({ status: "completed" }),
          },
        );

        if (!updateRes) return;

        if (!updateRes.ok) {
          setError(
            updateRes.data?.error ||
              updateRes.data?.message ||
              "Could not mark appointment as completed.",
          );
          return;
        }
      }

      const res = await fetchJson("http://localhost:5000/api/invoices", {
        method: "POST",
        body: JSON.stringify({ appointment_id: apptId }),
      });

      if (!res) return;

      if (res.ok) {
        setSuccess("Invoice created successfully.");
        setSelectedAppointmentId("");
        await loadData();
        return;
      }

      if (res.status === 403) {
        setError(
          "Access denied: Only Receptionists or Admins can create invoices.",
        );
      } else {
        setError(
          res.data?.error || res.data?.message || "Could not create invoice.",
        );
      }
    } catch {
      setError("Connection failed. Is the Node server running on port 5000?");
    } finally {
      setCreating(false);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    if (updatingInvoiceId) return;

    setError("");
    setSuccess("");

    const inv = invoices.find((i) => i?.invoice_id === invoiceId);
    const patientDue = inv?.breakdown?.patient_amount;
    if (typeof patientDue === "number") {
      const ok = window.confirm(
        `Record payment of $${patientDue.toFixed(2)} for invoice #${invoiceId}?`,
      );
      if (!ok) return;
    }

    setUpdatingInvoiceId(invoiceId);

    try {
      const res = await fetchJson(
        `http://localhost:5000/api/invoices/${invoiceId}/pay`,
        { method: "PATCH" },
      );

      if (!res) return;

      if (res.ok) {
        setSuccess(`Payment recorded. Invoice #${invoiceId} marked as paid.`);
        await loadData();
        return;
      }

      if (res.status === 403) {
        setError(
          "Access denied: Only Receptionists or Admins can record payments.",
        );
      } else {
        setError(
          res.data?.error ||
            res.data?.message ||
            "Could not mark invoice as paid.",
        );
      }
    } catch {
      setError("Connection failed. Is the Node server running on port 5000?");
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  const handleMarkUnpaid = async (invoiceId) => {
    if (updatingInvoiceId) return;

    setError("");
    setSuccess("");
    setUpdatingInvoiceId(invoiceId);

    try {
      const res = await fetchJson(
        `http://localhost:5000/api/invoices/${invoiceId}`,
        {
          method: "PUT",
          body: JSON.stringify({ status: "unpaid" }),
        },
      );

      if (!res) return;

      if (res.ok) {
        setSuccess(`Invoice #${invoiceId} marked as unpaid.`);
        await loadData();
        return;
      }

      if (res.status === 403) {
        setError(
          "Access denied: Only Receptionists or Admins can update invoice status.",
        );
      } else {
        setError(
          res.data?.error ||
            res.data?.message ||
            "Could not mark invoice as unpaid.",
        );
      }
    } catch {
      setError("Connection failed. Is the Node server running on port 5000?");
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  return (
    <main className="page-wrapper">
      <div className="page-container-sm">
        <div className="page-header">
          <h1 className="page-title">Billing</h1>
          <p className="page-subtitle">Invoices and payment tracking.</p>
        </div>

        {(error || success) && (
          <div
            className={`alert ${error ? "alert-error" : "alert-success"}`}
            style={{ marginBottom: "var(--space-5)" }}
            role="status"
          >
            {error ? (
              <AlertCircle size={15} aria-hidden="true" />
            ) : (
              <CheckCircle size={15} aria-hidden="true" />
            )}
            <span>{error || success}</span>
          </div>
        )}

        <div className="card" style={{ marginBottom: "var(--space-5)" }}>
          <div className="card-header">
            <h2
              className="card-title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <DollarSign size={16} aria-hidden="true" />
              Create Invoice
            </h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadData}
              disabled={loading}
              aria-busy={loading}
            >
              <RefreshCcw size={14} aria-hidden="true" /> Refresh
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-state" role="status" aria-live="polite">
                <span
                  className="loading-spinner"
                  style={{ width: "20px", height: "20px", borderWidth: "2px" }}
                  aria-hidden="true"
                />
                Loading billing data…
              </div>
            ) : (
              <form
                onSubmit={handleCreateInvoice}
                aria-label="Create invoice form"
              >
                <div className="form-group">
                  <label htmlFor="appointment_id" className="form-label">
                    Completed Appointment{" "}
                    <span className="required" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="appointment_id"
                    className="form-select"
                    value={selectedAppointmentId}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    required
                    aria-required="true"
                  >
                    <option value="">— Select a completed appointment —</option>
                    {eligibleAppointments.map((a) => (
                      <option key={a.appointment_id} value={a.appointment_id}>
                        #{a.appointment_id} · Patient {a.patient_id} · CPT{" "}
                        {a.cpt_code || a.cpt_id} · {a.status}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{
                      marginTop: "var(--space-2)",
                      color: "var(--color-text-muted)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    Appointments with a CPT can be invoiced. If needed, billing
                    will verify insurance first, then mark the appointment as
                    completed.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success btn-full"
                  disabled={creating || !selectedAppointmentId}
                  aria-busy={creating}
                >
                  {creating ? (
                    <>
                      <span
                        className="loading-spinner"
                        style={{
                          width: "14px",
                          height: "14px",
                          borderWidth: "2px",
                        }}
                        aria-hidden="true"
                      />
                      Creating invoice…
                    </>
                  ) : (
                    <>
                      <DollarSign size={15} aria-hidden="true" />
                      Create Invoice
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="card-header">
            <h2 className="card-title">Invoices</h2>
            <span className="badge badge-gray">{invoices.length}</span>
          </div>
          <div className="card-body">
            {!loading && invoices.length === 0 ? (
              <div className="empty-state" role="status">
                <div className="empty-state-title">No invoices yet</div>
                <div className="empty-state-text">
                  Create your first invoice from a completed appointment.
                </div>
              </div>
            ) : (
              <div
                className="table-wrapper"
                role="region"
                aria-label="Invoices table"
              >
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Appointment</th>
                      <th>Patient</th>
                      <th>CPT</th>
                      <th>Total</th>
                      <th>Patient Due</th>
                      <th>Status</th>
                      <th>Issued</th>
                      <th>Paid At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.invoice_id}>
                        <td>#{inv.invoice_id}</td>
                        <td>#{inv.appointment_id}</td>
                        <td>{inv.patient_id}</td>
                        <td>
                          {appointmentById.get(inv.appointment_id)?.cpt_code ||
                            inv.cpt_id}
                        </td>
                        <td>
                          {typeof inv?.breakdown?.total_amount === "number"
                            ? `$${inv.breakdown.total_amount.toFixed(2)}`
                            : "—"}
                        </td>
                        <td>
                          {typeof inv?.breakdown?.patient_amount === "number"
                            ? `$${inv.breakdown.patient_amount.toFixed(2)}`
                            : "—"}
                        </td>
                        <td>
                          <span className={badgeForStatus(inv.status)}>
                            {inv.status || "—"}
                          </span>
                        </td>
                        <td>
                          {inv.issued_at
                            ? new Date(inv.issued_at).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          {inv.paid_at
                            ? new Date(inv.paid_at).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          {inv.status === "paid" ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleMarkUnpaid(inv.invoice_id)}
                              disabled={Boolean(updatingInvoiceId)}
                              aria-busy={updatingInvoiceId === inv.invoice_id}
                            >
                              Mark Unpaid
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleMarkPaid(inv.invoice_id)}
                              disabled={Boolean(updatingInvoiceId)}
                              aria-busy={updatingInvoiceId === inv.invoice_id}
                            >
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <Link to="/" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>
    </main>
  );
}

export default Billing_page;
