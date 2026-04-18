import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Edit, ArrowLeft, User, Phone, Mail, MapPin, Calendar, Activity } from 'lucide-react';

const Records_page = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync state if the ID in the URL changes
  useEffect(() => {
    const fetchPatientData = async () => {
      const token = localStorage.getItem('token');

      try {
        const response = await fetch(`http://localhost:5000/api/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setPatient(data);
        } else if (response.status === 404) {
          setPatient(null);
        } else {
          console.error("Failed to fetch patient");
        }
      } catch (err) {
        console.error("Connection error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`http://localhost:5000/patients/${patient.patient_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(patient)
        });

        if (res.ok) {
        alert("✅ Patient updated");
        setIsEditing(false);
        } else {
        alert("❌ Failed to update");
        }
    } catch (err) {
        console.error(err);
    }
  };

  // Loading state
  if (loading) {
    return <div style={{ padding: '20px' }}>Loading patient...</div>;
  }

  // Not found state
  if (!patient) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Patient not found</h2>
        <button onClick={() => navigate('/patients')}>
          <ArrowLeft size={16} /> Back to list
        </button>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={navHeader}>
        <button onClick={() => navigate('/patients')} style={backBtn}>
          <ArrowLeft size={18} /> Back to Patient List
        </button>
      </div>

      <div style={card}>
        <div style={cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={avatarCircle}><User size={30} color="#007bff" /></div>
            <div>
              <h2 style={{ margin: 0, color: '#333' }}>
                {isEditing ? "Editing Record" : "Patient Profile"}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#666', fontWeight: 'bold' }}>ID: #{patient.patient_id}</p>
            </div>
          </div>
          <button 
            style={isEditing ? saveBtn : editBtn} 
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
          >
            {isEditing ? <><Save size={18} /> Save Changes</> : <><Edit size={18} /> Edit Record</>}
          </button>
        </div>

        <div style={divider}></div>

        <div style={formGrid}>
          {[
            { label: "First Name", icon: <User size={14}/>, key: "first_name" },
            { label: "Last Name", icon: <User size={14}/>, key: "last_name" },
            { label: "Email Address", icon: <Mail size={14}/>, key: "email" },
            { label: "Phone Number", icon: <Phone size={14}/>, key: "phone" },
            { label: "Date of Birth", icon: <Calendar size={14}/>, key: "dob", type: "date" },
            { label: "Blood Type", icon: <Activity size={14}/>, key: "blood_type" }
          ].map((field) => (
            <div key={field.key} style={inputGroup}>
              <label style={labelStyle}>{field.icon} {field.label}</label>
              <input 
                type={field.type || "text"}
                disabled={!isEditing} 
                style={isEditing ? activeInput : staticInput}
                // value ensures the current patient data is SHOWN in the box
                value={patient[field.key] || ""} 
                onChange={(e) => setPatient({...patient, [field.key]: e.target.value})}
              />
            </div>
          ))}
          <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
            <label style={labelStyle}><MapPin size={14} /> Residential Address</label>
            <input 
              disabled={!isEditing} 
              style={isEditing ? activeInput : staticInput}
              value={patient.address || ""}
              onChange={(e) => setPatient({...patient, address: e.target.value})}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Styles (Updated for Visibility) ---
const container = { maxWidth: "850px", margin: "40px auto", padding: "0 20px" };
const navHeader = { marginBottom: "20px" };
const card = { backgroundColor: "#fff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", border: "1px solid #eee" };
const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const avatarCircle = { width: "55px", height: "55px", backgroundColor: "#eef6ff", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" };
const divider = { height: "1px", backgroundColor: "#eee", marginBottom: "25px" };
const formGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "8px" };
const labelStyle = { fontSize: "13px", fontWeight: "bold", color: "#555", display: "flex", alignItems: "center", gap: "5px" };

const staticInput = { 
  padding: "12px", 
  border: "1px solid #eee", 
  backgroundColor: "#fcfcfc", 
  borderRadius: "8px", 
  color: "#333", // Dark grey text
  fontSize: "15px" 
};

const activeInput = { 
  padding: "12px", 
  border: "1px solid #007bff", 
  backgroundColor: "#fff", 
  borderRadius: "8px", 
  color: "#000", // Solid black text when editing
  fontSize: "15px", 
  outline: "none",
  boxShadow: "0 0 0 2px rgba(0,123,255,0.1)"
};

const editBtn = { display: "flex", gap: "8px", alignItems: "center", padding: "10px 20px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const saveBtn = { ...editBtn, backgroundColor: "#28a745" };
const backBtn = { background: "none", border: "none", color: "#007bff", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" };

export default Records_page;