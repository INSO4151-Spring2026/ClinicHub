import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link for navigation

const Patient_list = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const initialPatients = [
    { id: 1, firstName: "John", lastName: "Doe", email: "john@email.com", phone: "123-456-7890" },
    { id: 2, firstName: "Jane", lastName: "Smith", email: "jane@email.com", phone: "987-654-3210" },
    { id: 3, firstName: "Robert", lastName: "Brown", email: "robert@email.com", phone: "555-019-2837" },
  ];

  const filteredPatients = initialPatients.filter((patient) => {
    const searchString = searchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchString) ||
      patient.lastName.toLowerCase().includes(searchString) ||
      patient.email.toLowerCase().includes(searchString)
    );
  });

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
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInput}
            />
          </div>

          {/* Navigation Link to Create Patient Page */}
          <Link to="/create-patient" style={{ textDecoration: 'none' }}>
            <button style={addButton}>
              <UserPlus size={18} style={{ marginRight: '8px' }} />
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
          </tr>
        </thead>
        <tbody>
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <tr key={patient.id}>
                <td style={td}>{patient.id}</td>
                <td style={td}>{patient.firstName}</td>
                <td style={td}>{patient.lastName}</td>
                <td style={td}>{patient.email}</td>
                <td style={td}>{patient.phone}</td>
                <td style={td}><Link to={`/records/${patient.id}`} style={{ textDecoration: 'none' }}><button style={viewBtnStyle}>View Record</button></Link>
    </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ ...td, textAlign: 'center', padding: '30px', color: '#888' }}>
                No patients found matching "{searchTerm}"
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// 🎨 Styles (Keeping these consistent with your professional layout)
const container = {
  maxWidth: "1000px",
  margin: "40px auto",
  padding: "20px",
  backgroundColor: "#fff",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  fontFamily: "Inter, system-ui, sans-serif"
};

const headerSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "25px",
  flexWrap: "wrap",
  gap: "15px"
};

const actionsContainer = {
  display: "flex",
  alignItems: "center",
  gap: "12px"
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
  color: "#888"
};

const searchInput = {
  width: "75%",
  padding: "10px 10px 10px 40px",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  fontSize: "14px",
  outline: "none",
  color: "#333",
  backgroundColor: "#fcfcfc"
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
  boxShadow: "0 2px 4px rgba(0, 123, 255, 0.2)"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px"
};

const table_header = {
  borderBottom: "2px solid #f0f0f0",
  padding: "16px 12px",
  textAlign: "left",
  backgroundColor: "#fafafa",
  color: "#444",
  fontSize: "13px",
  fontWeight: "bold",
  textTransform: "uppercase"
};

const td = {
  padding: "14px 12px",
  borderBottom: "1px solid #eee",
  color: "#333",
  fontSize: "14px"
};

const viewBtnStyle = {
  padding: "6px 12px",
  backgroundColor: "#f0f7ff",
  color: "#007bff",
  border: "1px solid #007bff",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "bold"
};

export default Patient_list;