import React, { useState, useEffect } from "react"; // Added useEffect
import { Search, UserPlus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Patient_list = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [patients, setPatients] = useState([]); // State for backend data
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    page: 1,
    per_page: 10,
    has_next: false,
    has_prev: false,
  });
  const navigate = useNavigate();

  // Debounce search so we don't refetch on every single keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => clearTimeout(handle);
  }, [searchTerm]);

  // --- 1. CRUD: READ (Fetch data from Express Gateway) ---
  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem("token");
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(perPage),
        });

        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        }

        // Calling port 5000 (Express) which proxies to port 5002 (Flask)
        const response = await fetch(
          `http://localhost:5000/api/patients?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.status === 401) {
          navigate("/login"); // Redirect if token is missing/expired
          return;
        }

        const data = await response.json();

        // Backend returns either an array (legacy) or { patients: [...], pagination: {...} }
        const normalizedPatients = Array.isArray(data)
          ? data
          : Array.isArray(data?.patients)
            ? data.patients
            : [];
        setPatients(normalizedPatients);

        if (!Array.isArray(data) && data?.pagination) {
          setPagination(data.pagination);
        } else {
          // Fallback for legacy array response.
          setPagination({
            total: normalizedPatients.length,
            pages: 1,
            page: 1,
            per_page: normalizedPatients.length,
            has_next: false,
            has_prev: false,
          });
        }
      } catch (err) {
        console.error("Error loading patients:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [navigate, page, perPage, debouncedSearchTerm]);

  // --- 2. CRUD: DELETE (Optional functionality) ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/patients/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setPatients((prev) => prev.filter((p) => p.patient_id !== id));
    } else {
      console.error("Delete failed");
    }
  };

  return (
    <div style={container}>
      <div style={headerSection}>
        <h2 style={{ margin: 0, color: "#090909" }}>Patient List</h2>

        <div style={actionsContainer}>
          <div style={searchContainer}>
            <Search size={18} style={searchIcon} />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={searchInput}
            />
          </div>

          {loading ? <div style={loadingInline}>Loading…</div> : null}

          <Link to="/create-patient" style={{ textDecoration: "none" }}>
            <button style={addButton}>
              <UserPlus size={18} style={{ marginRight: "8px" }} />
              Add Patient
            </button>
          </Link>
        </div>
      </div>

      <table style={table}>
        <thead>
          <tr>
            <th style={table_header}>ID</th>
            <th style={table_header}>First Name</th>
            <th style={table_header}>Last Name</th>
            <th style={table_header}>Email</th>
            <th style={table_header}>Phone</th>
            <th style={{ ...table_header, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan="6"
                style={{
                  ...td,
                  textAlign: "center",
                  padding: "30px",
                  color: "#888",
                }}
              >
                Loading Patients...
              </td>
            </tr>
          ) : patients.length > 0 ? (
            patients.map((patient) => (
              <tr key={patient.patient_id}>
                <td style={td}>{patient.patient_id}</td>
                <td style={td}>{patient.first_name}</td>
                <td style={td}>{patient.last_name}</td>
                <td style={td}>{patient.email}</td>
                <td style={td}>{patient.phone || "N/A"}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <Link
                    to={`/records/${patient.patient_id}`}
                    style={{ textDecoration: "none", marginRight: "8px" }}
                  >
                    <button style={viewBtnStyle}>View Record</button>
                  </Link>
                  <button
                    onClick={() => handleDelete(patient.patient_id)}
                    style={deleteBtnStyle}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="6"
                style={{
                  ...td,
                  textAlign: "center",
                  padding: "30px",
                  color: "#888",
                }}
              >
                No patients found matching "{searchTerm}"
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={paginationBar}>
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!pagination?.has_prev || page <= 1}
          style={{
            ...paginationBtn,
            opacity: !pagination?.has_prev || page <= 1 ? 0.6 : 1,
            cursor:
              !pagination?.has_prev || page <= 1 ? "not-allowed" : "pointer",
          }}
        >
          Prev
        </button>

        <div style={pageInfo}>
          Page {pagination?.page ?? page} of {pagination?.pages ?? 1}
        </div>

        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={!pagination?.has_next}
          style={{
            ...paginationBtn,
            opacity: !pagination?.has_next ? 0.6 : 1,
            cursor: !pagination?.has_next ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// 🎨 Styles (Your original professional layout preserved)
const container = {
  maxWidth: "1000px",
  margin: "40px auto",
  padding: "20px",
  backgroundColor: "#fff",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  fontFamily: "Inter, system-ui, sans-serif",
};

const headerSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "25px",
  flexWrap: "wrap",
  gap: "15px",
};

const actionsContainer = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const loadingInline = {
  fontSize: "13px",
  color: "#666",
  paddingLeft: "4px",
};

const searchContainer = {
  position: "relative",
  width: "280px",
};

const searchIcon = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#888",
};

const searchInput = {
  width: "75%", // Adjusted to fill container properly
  padding: "10px 10px 10px 40px",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  fontSize: "14px",
  outline: "none",
  color: "#333",
  backgroundColor: "#fcfcfc",
};

const addButton = {
  display: "flex",
  alignItems: "center",
  backgroundColor: "#007bff",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0, 123, 255, 0.2)",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
};

const table_header = {
  borderBottom: "2px solid #f0f0f0",
  padding: "16px 12px",
  textAlign: "left",
  backgroundColor: "#fafafa",
  color: "#444",
  fontSize: "13px",
  fontWeight: "bold",
  textTransform: "uppercase",
};

const td = {
  padding: "14px 12px",
  borderBottom: "1px solid #eee",
  color: "#333",
  fontSize: "14px",
};

const viewBtnStyle = {
  padding: "6px 12px",
  backgroundColor: "#f0f7ff",
  color: "#007bff",
  border: "1px solid #007bff",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "bold",
};

const deleteBtnStyle = {
  padding: "6px",
  backgroundColor: "#fff1f0",
  color: "#ff4d4f",
  border: "1px solid #ff4d4f",
  borderRadius: "4px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
};

const paginationBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "16px",
};

const paginationBtn = {
  padding: "8px 12px",
  backgroundColor: "#fff",
  color: "#333",
  border: "1px solid #e0e0e0",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: "600",
};

const pageInfo = {
  fontSize: "13px",
  color: "#666",
};

export default Patient_list;
