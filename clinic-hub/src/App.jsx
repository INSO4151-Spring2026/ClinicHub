import { useState } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom' 
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login_page from './Login_page'
import Create_patient from './Create_patient'
import Appointment_page from './Appointment_page'
import Vitals_page from './Vitals_page'  
import Plan_page from './Plan_page'


// Home "/" 
const Home = ({ role, handleRoleChange }) => (
  <div style={{ padding: '20px' }}>
    <h1>Medical System Dashboard</h1>
    
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Current Session Role:</label>
      <select value={role} onChange={handleRoleChange} style={{ padding: '8px' }}>
        <option value="">-- Select Role --</option>
        <option value="Admin">Admin</option>
        <option value="Doctor">Doctor</option>
        <option value="Receptionist">Receptionist</option>
      </select>
      <p>Acting as: <strong>{role || 'Public'}</strong></p>
    </div>

    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <Link to="/login"><button>Login Page</button></Link>
      <Link to="/plan"><button>Health Plans</button></Link>
      
      {/* These links only show up if the role matches */}
      {(role === 'Admin' || role === 'Doctor') && <Link to="/vitals"><button>Vitals</button></Link>}
      {(role === 'Admin' || role === 'Receptionist') && <Link to="/create-patient"><button>Create Patient</button></Link>}
      {role && <Link to="/appointment"><button>Appointments</button></Link>}
    </div>
  </div>
);

function App() {
  const [role, setRole] = useState('')

  const handleRoleChange = (e) => {
    setRole(e.target.value)
  }

  // ProtectedRoute
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

      <Route 
        path="/vitals" 
        element={
          <ProtectedRoute role={role} allowedRoles={['Admin', 'Doctor']}>
            <Vitals_page />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/create-patient" 
        element={
          <ProtectedRoute role={role} allowedRoles={['Admin', 'Receptionist']}>
            <Create_patient />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/appointment" 
        element={
          <ProtectedRoute role={role} allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
            <Appointment_page />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App