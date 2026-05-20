import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, AlertCircle, ArrowLeft } from "lucide-react";

const BMI_CONFIG = {
  Underweight: { badge: "badge-yellow", range: "< 18.5" },
  Normal: { badge: "badge-green", range: "18.5–24.9" },
  Overweight: { badge: "badge-yellow", range: "25–29.9" },
  Obese: { badge: "badge-red", range: "≥ 30" },
};

function Field({ id, label, required, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && (
          <span className="required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Vitals_page() {
  const navigate = useNavigate();
  const { patient_id } = useParams();

  const [patientName, setPatientName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bp, setBp] = useState("");
  const [temperature, setTemperature] = useState("");
  const [pulse, setPulse] = useState("");
  const [respiratory_rate, setRespiratoryRate] = useState("");
  const [o2_saturation, setO2Saturation] = useState("");
  const [pain_level, setPainLevel] = useState("0");
  const [head_circumference, setHeadCirc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem("token");

  const h = parseFloat(height);
  const w = parseFloat(weight);
  const bmi = h > 0 && w > 0 ? (w / (h * h)).toFixed(2) : "";
  const bmi_category = bmi
    ? bmi < 18.5
      ? "Underweight"
      : bmi < 25
        ? "Normal"
        : bmi < 30
          ? "Overweight"
          : "Obese"
    : "";

  // Load patient name for display
  useEffect(() => {
    if (!patient_id) return;
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`http://localhost:5000/api/patients/${patient_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPatientName(`${data.first_name} ${data.last_name}`);
      })
      .catch(() => {});
  }, [patient_id, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!token) {
      navigate("/login");
      return;
    }
    if (!patient_id) {
      setError(
        "No patient selected. Return to the patient list and try again.",
      );
      setLoading(false);
      return;
    }

    const payload = {
      patient_id: Number(patient_id),
      height,
      weight,
      bmi,
      bmi_category,
      bp,
      temperature,
      pulse,
      respiratory_rate,
      o2_saturation,
      pain_level,
      head_circumference,
    };

    try {
      const response = await fetch("http://localhost:5000/api/vitals", {
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
      if (response.status === 403) {
        setError("Access denied: only Doctors and Admins can record vitals.");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Reset measurements
        setHeight("");
        setWeight("");
        setBp("");
        setTemperature("");
        setPulse("");
        setRespiratoryRate("");
        setO2Saturation("");
        setPainLevel("0");
        setHeadCirc("");
      } else {
        setError(data?.error || "Could not save vitals. Please try again.");
      }
    } catch {
      setError("Connection failed. Check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrapper">
      <div className="page-container-sm">
        {/* Back */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/patients")}
            aria-label="Back to patient list"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Back to Patient List
          </button>
        </div>

        <div className="page-header">
          <h1 className="page-title">Patient Vitals</h1>
          <p className="page-subtitle">
            {patientName
              ? `Recording vitals for ${patientName}`
              : "Record the patient's current physical measurements and vital signs."}
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

        {success && (
          <div
            className="alert alert-success"
            style={{ marginBottom: "var(--space-5)" }}
            role="status"
            aria-live="polite"
          >
            Vitals recorded successfully.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Patient vitals form"
        >
          {/* Measurements */}
          <div className="card" style={{ marginBottom: "var(--space-5)" }}>
            <div className="card-header">
              <h2 className="card-title">Body Measurements</h2>
            </div>
            <div className="card-body">
              <div className="form-grid-2">
                <Field id="height" label="Height (m)" required>
                  <input
                    type="number"
                    id="height"
                    step="0.01"
                    className="form-input"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required
                    aria-required="true"
                    placeholder="e.g. 1.75"
                  />
                </Field>

                <Field id="weight" label="Weight (kg)" required>
                  <input
                    type="number"
                    id="weight"
                    step="0.1"
                    className="form-input"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    aria-required="true"
                    placeholder="e.g. 72.0"
                  />
                </Field>

                {/* BMI readout */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">BMI (auto-calculated)</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                    }}
                  >
                    <input
                      className="form-input form-input-readonly"
                      value={bmi || "—"}
                      readOnly
                      aria-label="Calculated BMI"
                      style={{ flex: 1 }}
                    />
                    {bmi_category && (
                      <span
                        className={`badge ${BMI_CONFIG[bmi_category]?.badge}`}
                        aria-label={`BMI category: ${bmi_category}`}
                      >
                        {bmi_category}
                      </span>
                    )}
                  </div>
                  {bmi_category && (
                    <p className="form-hint">
                      Range: {BMI_CONFIG[bmi_category]?.range}
                    </p>
                  )}
                </div>

                <Field id="head_circumference" label="Head Circumference (cm)">
                  <input
                    type="number"
                    id="head_circumference"
                    step="0.1"
                    className="form-input"
                    value={head_circumference}
                    onChange={(e) => setHeadCirc(e.target.value)}
                    placeholder="e.g. 56"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="card" style={{ marginBottom: "var(--space-6)" }}>
            <div className="card-header">
              <h2 className="card-title">Vital Signs</h2>
            </div>
            <div className="card-body">
              <div
                className="form-grid-3"
                style={{ marginBottom: "var(--space-5)" }}
              >
                <Field id="bp" label="Blood Pressure (mmHg)" required>
                  <input
                    id="bp"
                    className="form-input"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    required
                    aria-required="true"
                  />
                </Field>

                <Field id="temperature" label="Temperature (°C)" required>
                  <input
                    type="number"
                    id="temperature"
                    step="0.1"
                    className="form-input"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="36.6"
                    required
                    aria-required="true"
                  />
                </Field>

                <Field id="pulse" label="Pulse (bpm)" required>
                  <input
                    type="number"
                    id="pulse"
                    className="form-input"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="72"
                    required
                    aria-required="true"
                  />
                </Field>
              </div>

              <div className="form-grid-3">
                <Field id="respiratory_rate" label="Resp. Rate (/min)" required>
                  <input
                    type="number"
                    id="respiratory_rate"
                    className="form-input"
                    value={respiratory_rate}
                    onChange={(e) => setRespiratoryRate(e.target.value)}
                    placeholder="16"
                    required
                    aria-required="true"
                  />
                </Field>

                <Field id="o2_saturation" label="O₂ Saturation (%)" required>
                  <input
                    type="number"
                    id="o2_saturation"
                    className="form-input"
                    value={o2_saturation}
                    onChange={(e) => setO2Saturation(e.target.value)}
                    placeholder="98"
                    required
                    aria-required="true"
                  />
                </Field>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="pain_level" className="form-label">
                    Pain Level (0–10){" "}
                    <span className="required" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    type="number"
                    id="pain_level"
                    min="0"
                    max="10"
                    className="form-input"
                    value={pain_level}
                    onChange={(e) => setPainLevel(e.target.value)}
                    placeholder="0"
                    required
                    aria-required="true"
                  />
                  <p className="form-hint">0 = no pain · 10 = worst possible</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
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
                  Saving vitals…
                </>
              ) : (
                <>
                  <Activity size={17} aria-hidden="true" />
                  Save Vitals
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => navigate(`/records/${patient_id}`)}
            >
              View Patient Record
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Vitals_page;
