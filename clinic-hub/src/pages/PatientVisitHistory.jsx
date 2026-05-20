import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, AlertCircle, Activity, FileText } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mergeVisits(medicalRecords, vitalsData) {
  const byAppt = new Map(); // appointment_id → { medRecord, vitals, date }

  for (const rec of medicalRecords) {
    if (rec.appointment_id) {
      byAppt.set(rec.appointment_id, {
        medRecord: rec,
        vitals: null,
        date: rec.record_date,
        providerName: rec.provider_name,
      });
    }
  }

  for (const v of vitalsData) {
    if (v.appointment_id && byAppt.has(v.appointment_id)) {
      byAppt.get(v.appointment_id).vitals = v;
    } else if (v.appointment_id) {
      byAppt.set(v.appointment_id, {
        medRecord: null,
        vitals: v,
        date: v.recorded_at,
        providerName: v.recorder_name,
      });
    }
  }

  // Standalone entries (no appointment_id) — group by calendar day
  const standaloneVisits = [];

  for (const rec of medicalRecords.filter((r) => !r.appointment_id)) {
    standaloneVisits.push({
      medRecord: rec,
      vitals: null,
      date: rec.record_date,
      providerName: rec.provider_name,
    });
  }

  for (const v of vitalsData.filter((v) => !v.appointment_id)) {
    const vDay = v.recorded_at?.substring(0, 10);
    const match = standaloneVisits.find(
      (s) => s.medRecord && s.date?.substring(0, 10) === vDay
    );
    if (match) {
      match.vitals = v;
    } else {
      standaloneVisits.push({
        medRecord: null,
        vitals: v,
        date: v.recorded_at,
        providerName: v.recorder_name,
      });
    }
  }

  const all = [...byAppt.values(), ...standaloneVisits];
  all.sort((a, b) => new Date(b.date) - new Date(a.date));
  return all;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function VitalRow({ label, value, unit }) {
  if (value == null || value === "") return null;
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <p className="form-label" style={{ marginBottom: "2px" }}>{label}</p>
      <p style={{ margin: 0 }}>
        {value}{unit ? <span style={{ color: "var(--color-text-secondary)", marginLeft: "4px" }}>{unit}</span> : null}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function PatientVisitHistory({ patientId }) {
  const navigate = useNavigate();

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchJson = async (url) => {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
        typeof text === "string" && text.trimStart().startsWith("<!DOCTYPE html>");
      data = { message: looksLikeHtml ? `Request failed (HTTP ${res.status})` : text };
    }
    return { ok: res.ok, status: res.status, data };
  };

  useEffect(() => {
    if (!patientId) return;
    if (!token) { navigate("/login"); return; }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      const [medResult, vitResult] = await Promise.all([
        fetchJson(`http://localhost:5000/api/medical-records?patient_id=${patientId}`),
        fetchJson(`http://localhost:5000/api/vitals?patient_id=${patientId}`),
      ]);

      if (cancelled) return;
      if (!medResult || !vitResult) return; // 401 redirect already fired

      if (!medResult.ok && !vitResult.ok) {
        setError("Failed to load visit history.");
        setLoading(false);
        return;
      }

      const medRecords = medResult.ok && Array.isArray(medResult.data) ? medResult.data : [];
      const vitalsData = vitResult.ok && Array.isArray(vitResult.data) ? vitResult.data : [];

      setVisits(mergeVisits(medRecords, vitalsData));
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [patientId]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <ClipboardList size={20} aria-hidden="true" />
          Visit History
        </h2>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-error" role="alert" aria-live="polite">
            <AlertCircle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        {loading && (
          <p aria-busy="true" aria-live="polite">Loading visit history…</p>
        )}

        {!loading && !error && visits.length === 0 && (
          <p className="empty-state">No visit records found for this patient.</p>
        )}

        {!loading && visits.map((visit, idx) => (
          <div
            key={idx}
            className="card"
            style={{ marginBottom: "var(--space-4)", border: "1px solid var(--color-border)" }}
          >
            {/* Visit card header */}
            <div className="card-header" style={{ paddingBottom: "var(--space-3)" }}>
              <div>
                <span className="badge badge-gray">{formatDate(visit.date)}</span>
                {visit.providerName && (
                  <span
                    style={{
                      marginLeft: "var(--space-3)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {visit.providerName}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                {visit.vitals && (
                  <span className="badge badge-blue">
                    <Activity size={11} aria-hidden="true" /> Vitals
                  </span>
                )}
                {visit.medRecord && (
                  <span className="badge badge-green">
                    <FileText size={11} aria-hidden="true" /> Clinical
                  </span>
                )}
              </div>
            </div>

            <div className="card-body" style={{ paddingTop: "var(--space-3)" }}>
              {/* ── Vitals section ── */}
              {visit.vitals && (
                <div style={{ marginBottom: visit.medRecord ? "var(--space-5)" : 0 }}>
                  <p className="form-section-title" style={{ marginBottom: "var(--space-3)" }}>
                    <Activity size={13} aria-hidden="true" /> Vitals
                  </p>
                  <div className="form-grid-3">
                    <VitalRow label="Blood Pressure" value={visit.vitals.blood_pressure} unit="mmHg" />
                    <VitalRow label="Temperature" value={visit.vitals.temperature_c} unit="°C" />
                    <VitalRow label="Pulse" value={visit.vitals.pulse_bpm} unit="bpm" />
                    <VitalRow label="O₂ Saturation" value={visit.vitals.o2_saturation} unit="%" />
                    <VitalRow label="Resp. Rate" value={visit.vitals.respiratory_rate} unit="/min" />
                    <VitalRow label="Pain Level" value={visit.vitals.pain_level != null ? `${visit.vitals.pain_level} / 10` : null} />
                  </div>
                  {(visit.vitals.height_m || visit.vitals.weight_kg || visit.vitals.bmi) && (
                    <div className="form-grid-3" style={{ marginTop: "var(--space-3)" }}>
                      <VitalRow label="Height" value={visit.vitals.height_m} unit="m" />
                      <VitalRow label="Weight" value={visit.vitals.weight_kg} unit="kg" />
                      {visit.vitals.bmi && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <p className="form-label" style={{ marginBottom: "2px" }}>BMI</p>
                          <p style={{ margin: 0 }}>
                            {visit.vitals.bmi}
                            {visit.vitals.bmi_category && (
                              <span
                                className="badge badge-gray"
                                style={{ marginLeft: "var(--space-2)" }}
                              >
                                {visit.vitals.bmi_category}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      <VitalRow label="Head Circ." value={visit.vitals.head_circumference_cm} unit="cm" />
                    </div>
                  )}
                </div>
              )}

              {/* ── Clinical notes section ── */}
              {visit.medRecord && (
                <div>
                  <p className="form-section-title" style={{ marginBottom: "var(--space-3)" }}>
                    <FileText size={13} aria-hidden="true" /> Clinical Notes
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <span className="badge badge-blue" style={{ marginBottom: "var(--space-2)", display: "inline-flex", fontSize: "var(--text-sm)" }}>Diagnosis</span>
                      <p style={{ margin: 0 }}>{visit.medRecord.diagnosis}</p>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <span className="badge badge-green" style={{ marginBottom: "var(--space-2)", display: "inline-flex", fontSize: "var(--text-sm)" }}>Treatment Plan</span>
                      <p style={{ margin: 0 }}>{visit.medRecord.treatment_plan}</p>
                    </div>
                    {visit.medRecord.notes && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <span className="badge badge-gray" style={{ marginBottom: "var(--space-2)", display: "inline-flex", fontSize: "var(--text-sm)" }}>Notes</span>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                          {visit.medRecord.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientVisitHistory;
