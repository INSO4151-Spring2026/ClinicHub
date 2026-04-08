import { useState } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom' 
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login_page from './pages/Login_page'
import Create_patient from './pages/Create_patient'
import Appointment_page from './pages/Appointment_page'
import Vitals_page from './pages/Vitals_page'  
import Plan_page from './pages/Plan_page'
import Reports_page from './pages/Reports_page'

// --- HOME COMPONENT ---
const Home = ({ role, handleRoleChange }) => (
  /* Main Container */
  <div style={{ 
    maxWidth: '900px', 
    margin: '40px auto', 
    padding: '30px', 
    backgroundColor: '#ffffff', 
    color: '#333333',           
    border: '1px solid #ddd', 
    borderRadius: '12px', 
    fontFamily: 'Arial, sans-serif',
    textAlign: 'left',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }}>
    
    {/* Header Section */}
    <header style={{ textAlign: 'center', marginBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
        <img src={viteLogo} alt="Vite logo" style={{ height: '50px' }} />
        <img src={reactLogo} alt="React logo" style={{ height: '50px' }} />
      </div>
      <h1 style={{ color: '#222', margin: '0 0 10px 0' }}>Clinic Hub Management System</h1>
      <p style={{ color: '#666', fontSize: '1.1rem' }}>Secure Clinical Administration Portal</p>
    </header>

    <div style={{ borderBottom: '2px solid #eee', marginBottom: '30px' }}></div>

    {/* Project Description Section */}
    <section style={{ marginBottom: '30px' }}>
      <h3 style={{ color: '#444', marginBottom: '10px' }}>Project Description</h3>
      <p style={{ lineHeight: '1.6', fontSize: '16px', color: '#444' }}>
We propose a solution that can consolidate core clinic operations into a single, 
cohesive platform to improve efficiency, 
reduce administrative overhead, and enhance patient care. 

      </p>
    </section>

    {/* Dashboard Navigation (Role-Based) */}
    <section style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '25px', 
      borderRadius: '8px', 
      border: '1px solid #eee', 
      marginBottom: '30px' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#222' }}> Dashboard Access</h3>
        <div style={{ textAlign: 'right' }}>
           <select 
             value={role} 
             onChange={handleRoleChange} 
             style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#333' }}
           >
             <option value="">-- Switch Role --</option>
             <option value="Admin">Admin</option>
             <option value="Doctor">Doctor</option>
             <option value="Receptionist">Receptionist</option>
           </select>
           <div style={{ fontSize: '13px', marginTop: '8px', color: '#555' }}>
             Current Role: <strong style={{ color: '#007bff' }}>{role || 'Public'}</strong>
           </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      
        <Link to="/login" style={{ textDecoration: 'none' }}><button style={blueBtn}>Login Page</button></Link>
        
     
        <Link to="/plan" style={{ textDecoration: 'none' }}><button style={greyBtn}>Health Plans</button></Link>
        
        {role === 'Admin' && <Link to="/reports" style={{ textDecoration: 'none' }}><button style={greyBtn}>Financial Reports</button></Link>}
        {(role === 'Admin' || role === 'Doctor') && <Link to="/vitals" style={{ textDecoration: 'none' }}><button style={greyBtn}>Vitals</button></Link>}
        {(role === 'Admin' || role === 'Receptionist') && <Link to="/create-patient" style={{ textDecoration: 'none' }}><button style={greyBtn}>Create Patient</button></Link>}
        {role && <Link to="/appointment" style={{ textDecoration: 'none' }}><button style={greyBtn}>Appointments</button></Link>}
      </div>
    </section>

    {/* Tech Stack & Team Grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
      <section style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #efefef' }}>
        <h3 style={{ color: '#444', marginTop: 0 }}>🛠 Tech Stack</h3>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', color: '#555' }}>
          <li><strong>Frontend:</strong> React (Vite) / React Router</li>
          <li><strong>Backend:</strong> Node.js / Express Middleware, Flask</li>
          <li><strong>Auth:</strong> JWT Bearer Tokens</li>
          <li><strong>Storage:</strong> LocalStorage for Session Persistence</li>
        </ul>
      </section>

      <section style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #efefef' }}>
        <h3 style={{ color: '#444', marginTop: 0 }}>👥 Project Team</h3>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', color: '#555' }}>
          <li style={{ whiteSpace: 'pre-line' }}><strong>Development:</strong>
            Alejandro A. Pérez Pabón,
            Christian N. Rodríguez Figueroa,
            Orlando G. Mercado Tellado,
            Cristian Barreras Tatsenko
          </li>
          <li style={{ marginTop: '10px' }}><strong>Docs:</strong> <span style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>View Documentation</span></li>
        </ul>
      </section>
    </div>
  </div>
);

// --- APP COMPONENT ---
function App() {
  const [role, setRole] = useState('')

  const handleRoleChange = (e) => {
    setRole(e.target.value)
  }

  const ProtectedRoute = ({ role, allowedRoles, children }) => {
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={<Home role={role} handleRoleChange={handleRoleChange} />} />
      <Route path="/login" element={<Login_page />} />
      <Route path="/plan" element={<Plan_page />} />

      <Route path="/vitals" element={
        <ProtectedRoute role={role} allowedRoles={['Admin', 'Doctor']}>
          <Vitals_page />
        </ProtectedRoute>
      } />

      <Route path="/create-patient" element={
        <ProtectedRoute role={role} allowedRoles={['Admin', 'Receptionist']}>
          <Create_patient />
        </ProtectedRoute>
      } />

      <Route path="/appointment" element={
        <ProtectedRoute role={role} allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
          <Appointment_page />
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute role={role} allowedRoles={['Admin']}>
          <Reports_page />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

// --- Button Styles ---
const blueBtn = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  transition: 'background 0.2s'
};

const greyBtn = {
  padding: '10px 20px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px'
};

export default App;