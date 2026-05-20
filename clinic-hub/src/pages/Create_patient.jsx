import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, AlertCircle } from "lucide-react";

function Create_patient() {
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    sex: "",
    email: "",
    phone: "",
    address: "",
    emergency_name: "",
    emergency_phone: "",
  });
  const [id_photo, setIdPhoto] = useState(null);
  const [previewUrl, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    Object.entries(fields).forEach(([key, val]) => {
      formData.append(
        key === "emergency_name"
          ? "emergency_contact_name"
          : key === "emergency_phone"
            ? "emergency_contact_phone"
            : key,
        val,
      );
    });
    if (id_photo) formData.append("id_photo", id_photo);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/patients", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        navigate("/patients");
      } else if (response.status === 403) {
        setError(
          "Access denied: You don't have permission to create patients.",
        );
      } else {
        setError(
          "Could not save patient. Please check your input and try again.",
        );
      }
    } catch {
      setError("Connection failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrapper">
      <div className="page-container-sm">
        <div className="page-header">
          <h1 className="page-title">Register New Patient</h1>
          <p className="page-subtitle">
            Fill in the patient's details to create their record.
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

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Create patient form"
        >
          {/* Personal Information */}
          <div className="card" style={{ marginBottom: "var(--space-5)" }}>
            <div className="card-header">
              <h2 className="card-title">Personal Information</h2>
            </div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="first_name" className="form-label">
                    First Name{" "}
                    <span className="required" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="first_name"
                    className="form-input"
                    value={fields.first_name}
                    onChange={set("first_name")}
                    required
                    aria-required="true"
                    autoComplete="given-name"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="last_name" className="form-label">
                    Full Last Name{" "}
                    <span className="required" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="last_name"
                    className="form-input"
                    value={fields.last_name}
                    onChange={set("last_name")}
                    required
                    aria-required="true"
                    autoComplete="family-name"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="dob" className="form-label">
                    Date of Birth{" "}
                    <span className="required" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    type="date"
                    id="dob"
                    className="form-input"
                    value={fields.dob}
                    onChange={set("dob")}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="sex" className="form-label">
                    Sex{" "}
                    <span className="required" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="sex"
                    className="form-select"
                    value={fields.sex}
                    onChange={set("sex")}
                    required
                    aria-required="true"
                  >
                    <option value="">Select…</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card" style={{ marginBottom: "var(--space-5)" }}>
            <div className="card-header">
              <h2 className="card-title">Contact Information</h2>
            </div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={fields.email}
                    onChange={set("email")}
                    autoComplete="email"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="form-input"
                    value={fields.phone}
                    onChange={set("phone")}
                    autoComplete="tel"
                  />
                </div>

                <div
                  className="form-group form-col-2"
                  style={{ marginBottom: 0 }}
                >
                  <label htmlFor="address" className="form-label">
                    Residential Address
                  </label>
                  <input
                    id="address"
                    className="form-input"
                    value={fields.address}
                    onChange={set("address")}
                    autoComplete="street-address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="card" style={{ marginBottom: "var(--space-5)" }}>
            <div className="card-header">
              <h2 className="card-title">Emergency Contact</h2>
            </div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="emergency_name" className="form-label">
                    Contact Name
                  </label>
                  <input
                    id="emergency_name"
                    className="form-input"
                    value={fields.emergency_name}
                    onChange={set("emergency_name")}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="emergency_phone" className="form-label">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="emergency_phone"
                    className="form-input"
                    value={fields.emergency_phone}
                    onChange={set("emergency_phone")}
                  />
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
                  Creating patient…
                </>
              ) : (
                <>
                  <UserPlus size={17} aria-hidden="true" />
                  Create Patient
                </>
              )}
            </button>

            <Link to="/" tabIndex={-1}>
              <button type="button" className="btn btn-secondary btn-full">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Create_patient;
