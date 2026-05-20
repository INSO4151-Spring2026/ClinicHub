import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Save,
  Edit,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  AlertCircle,
  ClipboardPlus,
  Activity,
} from "lucide-react";
import MedicalRecordForm from "./MedicalRecordForm";
import PatientVisitHistory from "./PatientVisitHistory";
import { Mars, Venus, VenusAndMars } from "lucide-react";

const Records_page = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const role = (
    localStorage.getItem("userRole") ||
    localStorage.getItem("role") ||
    ""
  ).toLowerCase();
  const canCreateRecord = ["admin", "doctor"].includes(role);

  useEffect(() => {
    const fetchPatient = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          `http://localhost:5000/api/patients/${id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.ok) {
          setPatient(await response.json());
        } else if (response.status === 404) {
          setPatient(null);
        }
      } catch (err) {
        console.error("Connection error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleSave = async () => {
    setError("");
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/patients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patient),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Non-JSON response from server");
      }

      if (res.ok) {
        setIsEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || "Failed to update patient record.");
      }
    } catch {
      setError("Server connection error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const FIELDS = [
    {
      key: "first_name",
      label: "First Name",
      icon: <User size={13} />,
      autoComplete: "given-name",
    },
    {
      key: "last_name",
      label: "Last Name",
      icon: <User size={13} />,
      autoComplete: "family-name",
    },
    {
      key: "email",
      label: "Email Address",
      icon: <Mail size={13} />,
      type: "email",
      autoComplete: "email",
    },
    {
      key: "phone",
      label: "Phone Number",
      icon: <Phone size={13} />,
      type: "tel",
      autoComplete: "tel",
    },
    {
      key: "dob",
      label: "Date of Birth",
      icon: <Calendar size={13} />,
      type: "date",
    },
    {
      key: "sex",
      label: "Sex",
      icon: <VenusAndMars size={13} />,
    },
    {
      key: "emergency_contact_name",
      label: "Emergency Contact Name",
      icon: <User size={13} />,
    },
    {
      key: "emergency_contact_phone",
      label: "Emergency Contact Phone",
      icon: <Phone size={13} />,
      type: "tel",
      autoComplete: "tel",
    },
  ];

  /* ── Loading ── */
  if (loading) {
    return (
      <main className="page-wrapper">
        <div className="loading-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          Loading patient record…
        </div>
      </main>
    );
  }

  /* ── Not found ── */
  if (!patient) {
    return (
      <main className="page-wrapper">
        <div className="page-container-md">
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon" aria-hidden="true">🔍</div>
                <p className="empty-state-title">Patient not found</p>
                <p className="empty-state-text">
                  No patient with ID #{id} exists in the system.
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: "var(--space-5)" }}
                  onClick={() => navigate("/patients")}
                >
                  <ArrowLeft size={15} aria-hidden="true" /> Back to Patient List
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const patientName = `${patient.first_name} ${patient.last_name}`;

  /* ── Record ── */
  return (
    <main className="page-wrapper">
      <div className="page-container-md">
        {/* Back */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <button
            onClick={() => navigate("/patients")}
            className="btn btn-ghost btn-sm"
            aria-label="Back to patient list"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Back to Patient List
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }} role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: "var(--space-4)" }} role="status" aria-live="polite">
            <span>Patient record updated successfully.</span>
          </div>
        )}

        {/* ── Patient info card ── */}
        <div className="card" style={{ marginBottom: "var(--space-5)" }}>
          <div className="card-header" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <div className="avatar avatar-lg" aria-hidden="true">
                <User size={26} />
              </div>
              <div>
                <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", marginBottom: "2px" }}>
                  {patientName}
                </h1>
                <span className="badge badge-gray">Patient #{patient.patient_id}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {canCreateRecord && (
                <button
                  type="button"
                  className={showRecordForm ? "btn btn-secondary" : "btn btn-primary"}
                  onClick={() => setShowRecordForm((v) => !v)}
                  aria-expanded={showRecordForm}
                >
                  <ClipboardPlus size={15} aria-hidden="true" />
                  {showRecordForm ? "Cancel" : "New Visit Record"}
                </button>
              )}

              {canCreateRecord && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(`/vitals/${patient.patient_id}`)}
                >
                  <Activity size={15} aria-hidden="true" /> Record Vitals
                </button>
              )}

              <Link to={`/plan?patient_id=${patient.patient_id}`} tabIndex={-1}>
                <button type="button" className="btn btn-secondary">
                  Insurance Plan
                </button>
              </Link>

              <button
                className={isEditing ? "btn btn-success" : "btn btn-secondary"}
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={saving}
                aria-label={isEditing ? "Save changes" : "Edit record"}
              >
                {saving ? (
                  <>
                    <span className="loading-spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} aria-hidden="true" />
                    Saving…
                  </>
                ) : isEditing ? (
                  <><Save size={15} aria-hidden="true" /> Save Changes</>
                ) : (
                  <><Edit size={15} aria-hidden="true" /> Edit Record</>
                )}
              </button>
            </div>
          </div>

          <div className="card-body">
            {isEditing && (
              <div className="alert alert-info" style={{ marginBottom: "var(--space-6)" }} role="status">
                <span>Editing mode — modify the fields below and click Save Changes.</span>
              </div>
            )}

            <p className="form-section-title">Personal Details</p>
            <div className="form-grid-2" style={{ marginBottom: "var(--space-8)" }}>
              {FIELDS.map((field) => (
                <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor={`field-${field.key}`} className="form-label">
                    {field.icon} {field.label}
                  </label>
                  <input
                    id={`field-${field.key}`}
                    type={field.type || "text"}
                    disabled={!isEditing}
                    className={isEditing ? "form-input" : "form-input form-input-readonly"}
                    value={patient[field.key] || ""}
                    onChange={(e) => setPatient({ ...patient, [field.key]: e.target.value })}
                    autoComplete={field.autoComplete}
                    aria-readonly={!isEditing}
                  />
                </div>
              ))}
            </div>

            <p className="form-section-title">Address</p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="field-address" className="form-label">
                <MapPin size={13} /> Residential Address
              </label>
              <input
                id="field-address"
                disabled={!isEditing}
                className={isEditing ? "form-input" : "form-input form-input-readonly"}
                value={patient.address || ""}
                onChange={(e) => setPatient({ ...patient, address: e.target.value })}
                autoComplete="street-address"
                aria-readonly={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
            <div className="card-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setIsEditing(false); setError(""); }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* ── New Visit Record form (doctor / admin only) ── */}
        {canCreateRecord && showRecordForm && (
          <div style={{ marginBottom: "var(--space-5)" }}>
            <MedicalRecordForm
              patientId={patient.patient_id}
              patientName={patientName}
              onSaved={() => setHistoryKey((k) => k + 1)}
            />
          </div>
        )}

        {/* ── Visit history (all roles) ── */}
        <PatientVisitHistory patientId={patient.patient_id} refreshKey={historyKey} />
      </div>
    </main>
  );
};

export default Records_page;
