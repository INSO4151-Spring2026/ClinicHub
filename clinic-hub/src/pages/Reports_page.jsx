import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  Hash,
  AlertCircle,
  Search,
} from "lucide-react";

const Reports_page = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async (e) => {
    e.preventDefault();
    if (loading || !selectedDate) return;

    setError("");
    setReportData(null);
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:5000/api/reports/daily-revenue?date=${selectedDate}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (response.ok) {
        setReportData(result);
      } else if (response.status === 403) {
        setError(
          "Access denied: Admin role required to view financial reports.",
        );
      } else {
        setError("Could not fetch report data. Please try again.");
      }
    } catch {
      setError("Connection failed. Is the Node server running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) =>
    typeof n === "number"
      ? n.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";

  return (
    <main className="page-wrapper">
      <div className="page-container-sm">
        <div className="page-header">
          <h1 className="page-title">Financial Revenue Report</h1>
          <p className="page-subtitle">
            Generate a daily procedure revenue summary by transaction date.
          </p>
        </div>

        {/* Query card */}
        <div className="card" style={{ marginBottom: "var(--space-5)" }}>
          <div className="card-header">
            <h2 className="card-title">Select Date</h2>
          </div>
          <div className="card-body">
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

            <form onSubmit={fetchReport} aria-label="Generate report form">
              <div className="form-group">
                <label htmlFor="report-date" className="form-label">
                  Transaction Date{" "}
                  <span className="required" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  type="date"
                  id="report-date"
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  aria-required="true"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading || !selectedDate}
                aria-busy={loading}
              >
                {loading ? (
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
                    Generating report…
                  </>
                ) : (
                  <>
                    <Search size={15} aria-hidden="true" />
                    Generate Report
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        {reportData && (
          <div className="card" role="region" aria-label="Report results">
            <div className="card-header">
              <h2 className="card-title">
                Summary —{" "}
                {new Date(reportData.date + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </h2>
              <span className="badge badge-blue">
                <BarChart2 size={11} aria-hidden="true" /> Daily Report
              </span>
            </div>
            <div className="card-body">
              {/* Stat cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-4)",
                  marginBottom: "var(--space-6)",
                }}
              >
                {/* Transactions */}
                <div
                  style={{
                    padding: "var(--space-5)",
                    backgroundColor: "var(--color-surface-alt)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    <Hash
                      size={15}
                      style={{ color: "var(--color-primary)" }}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-semibold)",
                        color: "var(--color-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Transactions
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-2xl)",
                      fontWeight: "var(--font-bold)",
                      color: "var(--color-text)",
                    }}
                  >
                    {reportData.transaction_count}
                  </div>
                </div>

                {/* Total Procedure Revenue */}
                <div
                  style={{
                    padding: "var(--space-5)",
                    backgroundColor: "var(--color-success-light)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-success-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    <TrendingUp
                      size={15}
                      style={{ color: "var(--color-success)" }}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-semibold)",
                        color: "var(--color-success)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Total Procedure Revenue
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-2xl)",
                      fontWeight: "var(--font-bold)",
                      color: "var(--color-success)",
                    }}
                  >
                    ${fmt(reportData.data.procedure_total)}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="divider" style={{ marginTop: 0 }} />
              <p
                className="form-section-title"
                style={{
                  marginBottom: "var(--space-4)",
                  paddingBottom: "var(--space-3)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                Breakdown
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                {[
                  {
                    label: "Procedure Total (CPT)",
                    value: `$${fmt(reportData.data.procedure_total)}`,
                    icon: <DollarSign size={15} />,
                  },
                  {
                    label: "Less: Insurance Covered",
                    value: `-$${fmt(reportData.data.insurance_covered)}`,
                    icon: <DollarSign size={15} />,
                  },
                  {
                    label: "Equals: Collected (Copays/Self-Pay)",
                    value: `$${fmt(reportData.data.total_revenue)}`,
                    icon: <DollarSign size={15} />,
                  },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-3) var(--space-4)",
                      backgroundColor: "var(--color-surface-alt)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border-light)",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {icon} {label}
                    </span>
                    <span
                      style={{
                        fontWeight: "var(--font-semibold)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: "var(--space-5)" }}>
          <Link to="/" tabIndex={-1}>
            <button className="btn btn-secondary btn-full">
              ← Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Reports_page;
