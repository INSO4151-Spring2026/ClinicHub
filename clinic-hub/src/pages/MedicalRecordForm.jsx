import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardPlus, AlertCircle, CheckCircle } from "lucide-react";

function MedicalRecordForm({ patientId, patientName, appointmentId }) {
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    diagnosis: "",
    treatment_plan: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (key) => (e) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

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
      const looksLikeHtml =
        typeof text === "string" &&
        text.trimStart().startsWith("<!DOCTYPE html>");
      data = {
        message: looksLikeHtml
          ? `Request failed (HTTP ${res.status})`
          : text,
      };
    }
    return { ok: res.ok, status: res.status, data };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fields.diagnosis.trim()) {
      setError("Diagnosis is required.");
      return;
    }
    if (!fields.treatment_plan.trim()) {
      setError("Treatment plan is required.");
      return;
    }

    setLoading(true);

    try {
      const body = {
        patient_id: patientId,
        diagnosis: fields.diagnosis.trim(),
        treatment_plan: fields.treatment_plan.trim(),
        notes: fields.notes.trim(),
      };
      if (appointmentId) body.appointment_id = appointmentId;

      const result = await fetchJson("http://localhost:5000/api/medical-records", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!result) return;

      if (!result.ok) {
        setError(result.data?.error || result.data?.message || "Failed to save record.");
        return;
      }

      setSuccess("Visit record saved successfully.");
      setFields({ diagnosis: "", treatment_plan: "", notes: "" });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <ClipboardPlus size={20} aria-hidden="true" />
          Visit Record
        </h2>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-error" role="alert" aria-live="polite">
            <AlertCircle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="status" aria-live="polite">
            <CheckCircle size={16} aria-hidden="true" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Patient</label>
              <input
                className="form-input"
                type="text"
                value={patientName ?? ""}
                readOnly
                aria-readonly="true"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                className="form-input"
                type="text"
                value={today}
                readOnly
                aria-readonly="true"
              />
            </div>

          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mr-diagnosis">
              Diagnosis <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="mr-diagnosis"
              className="form-input"
              rows={3}
              value={fields.diagnosis}
              onChange={set("diagnosis")}
              required
              aria-required="true"
              placeholder="Enter diagnosis"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mr-treatment-plan">
              Treatment Plan <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="mr-treatment-plan"
              className="form-input"
              rows={3}
              value={fields.treatment_plan}
              onChange={set("treatment_plan")}
              required
              aria-required="true"
              placeholder="Enter treatment plan"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mr-notes">
              Notes
            </label>
            <textarea
              id="mr-notes"
              className="form-input"
              rows={3}
              value={fields.notes}
              onChange={set("notes")}
              placeholder="Additional notes (optional)"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? "Saving…" : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MedicalRecordForm;
