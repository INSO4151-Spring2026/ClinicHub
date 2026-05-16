import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CalendarCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const Appointment_page = () => {
  const navigate = useNavigate();

  const [cptCodes, setCptCodes] = useState([]);
  const [cptLoading, setCptLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cptCodeId: "",
    date: "",
    time: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedCpt = useMemo(() => {
    const match = cptCodes.find(
      (c) => String(c.cpt_code_id) === String(formData.cptCodeId),
    );
    return match || null;
  }, [cptCodes, formData.cptCodeId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadCptCodes = async () => {
      setCptLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/cpt_codes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }

        if (!res.ok) {
          setCptCodes([]);
          setError(
            data?.error ||
              data?.message ||
              `Failed to load CPT codes (HTTP ${res.status}).`,
          );
          return;
        }

        const items = Array.isArray(data) ? data : [];
        setCptCodes(items);

        if (items.length > 0) {
          setFormData((f) => ({
            ...f,
            cptCodeId: f.cptCodeId || String(items[0].cpt_code_id),
          }));
        }
      } catch {
        setError("Connection failed. Is the server running?");
      } finally {
        setCptLoading(false);
      }
    };

    loadCptCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      setLoading(false);
      return;
    }

    if (!formData.cptCodeId) {
      setError("Please select a service (CPT code) before booking.");
      setLoading(false);
      return;
    }

    const start = new Date(`${formData.date}T${formData.time}:00`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const payload = {
      patient_id: 1,
      provider_user_id: 1,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      cpt_code_id: Number(formData.cptCodeId),
      reason: selectedCpt
        ? `${selectedCpt.code} - ${selectedCpt.description}`
        : undefined,
      notes: formData.notes,
    };

    try {
      const response = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      const result = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(
          result.error || "Could not save appointment. Please try again.",
        );
      }
    } catch {
      setError("Connection failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success State ── */
  if (submitted) {
    return (
      <main
        className="page-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 60px)",
        }}
      >
        <div style={{ width: "100%", maxWidth: "480px", textAlign: "center" }}>
          <div className="card">
            <div
              className="card-body"
              style={{ padding: "var(--space-10) var(--space-8)" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  width: "60px",
                  height: "60px",
                  backgroundColor: "var(--color-success-light)",
                  borderRadius: "50%",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "var(--space-5)",
                }}
                aria-hidden="true"
              >
                <CheckCircle2
                  size={32}
                  style={{ color: "var(--color-success)" }}
                />
              </div>
              <h1
                style={{
                  fontSize: "var(--text-xl)",
                  fontWeight: "var(--font-bold)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Appointment Confirmed
              </h1>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-6)",
                  fontSize: "var(--text-sm)",
                }}
              >
                <strong>
                  {selectedCpt
                    ? `${selectedCpt.code} - ${selectedCpt.description}`
                    : "Appointment"}
                </strong>{" "}
                scheduled for{" "}
                <strong>
                  {new Date(
                    `${formData.date}T${formData.time}`,
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>{" "}
                at <strong>{formData.time}</strong>.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => navigate("/calendar")}
                >
                  <Calendar size={16} aria-hidden="true" />
                  View on Calendar
                </button>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      cptCodeId: cptCodes.length
                        ? String(cptCodes[0].cpt_code_id)
                        : "",
                      date: "",
                      time: "",
                      notes: "",
                    });
                  }}
                >
                  Book Another Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Form ── */
  return (
    <main className="page-wrapper">
      <div className="page-container-sm">
        <div className="page-header">
          <h1 className="page-title">Schedule an Appointment</h1>
          <p className="page-subtitle">
            Fill in the details to book a clinic appointment.
          </p>
        </div>

        {error && (
          <div
            className="alert alert-error"
            style={{ marginBottom: "var(--space-5)" }}
            role="alert"
          >
            <AlertCircle size={15} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="Schedule appointment form"
            >
              <div className="form-group">
                <label htmlFor="appt-name" className="form-label">
                  Patient Name{" "}
                  <span className="required" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  type="text"
                  id="appt-name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  autoComplete="name"
                  placeholder="Full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="appt-email" className="form-label">
                  Email Address{" "}
                  <span className="required" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  type="email"
                  id="appt-email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  autoComplete="email"
                  placeholder="patient@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="appt-service" className="form-label">
                  Service Type{" "}
                  <span className="required" aria-hidden="true">
                    *
                  </span>
                </label>
                <select
                  id="appt-service"
                  name="cptCodeId"
                  className="form-select"
                  value={formData.cptCodeId}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  disabled={cptLoading || cptCodes.length === 0}
                >
                  {cptLoading ? (
                    <option value="">Loading CPT codes…</option>
                  ) : cptCodes.length === 0 ? (
                    <option value="">No CPT codes available</option>
                  ) : (
                    cptCodes.map((c) => (
                      <option key={c.cpt_code_id} value={c.cpt_code_id}>
                        {c.code} · {c.description}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="appt-date" className="form-label">
                    Date{" "}
                    <span className="required" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    type="date"
                    id="appt-date"
                    name="date"
                    className="form-input"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="appt-time" className="form-label">
                    Time{" "}
                    <span className="required" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    type="time"
                    id="appt-time"
                    name="time"
                    className="form-input"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div
                className="form-group"
                style={{ marginTop: "var(--space-5)" }}
              >
                <label htmlFor="appt-notes" className="form-label">
                  Notes (optional)
                </label>
                <textarea
                  id="appt-notes"
                  name="notes"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional details or concerns…"
                  rows={3}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                  marginTop: "var(--space-2)",
                }}
              >
                <button
                  type="submit"
                  className="btn btn-success btn-full btn-lg"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="loading-spinner"
                        style={{
                          width: "16px",
                          height: "16px",
                          borderWidth: "2px",
                        }}
                        aria-hidden="true"
                      />
                      Booking…
                    </>
                  ) : (
                    <>
                      <CalendarCheck size={17} aria-hidden="true" />
                      Confirm Booking
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={() => navigate("/calendar")}
                >
                  Cancel — Return to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Appointment_page;
