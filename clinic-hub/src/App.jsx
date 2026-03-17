import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login_page from './Login_page'
import Create_patient from './Create_patient'
import Appointment_page from './assets/Appointment_page'
import Vitals_page from './Vitals_page'  
import Plan_page from './Plan_page'

function App() {

  const [role, setRole] = useState('')

 
  const handleRoleChange = (e) => {
    setRole(e.target.value)
  }

  return (
    <Routes>
      <Route path="/" element={
        <>
          {/* Dropdown UI */}
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Current Session Role:</label>
            <select 
              value={role} 
              onChange={handleRoleChange}
              style={{ padding: '8px', borderRadius: '4px' }}
            >
              <option value="">-- Select Role --</option>
              <option value="Admin">Admin</option>
              <option value="Doctor">Doctor</option>
              <option value="Receptionist">Receptionist</option>
            </select>
            <p>Acting as: <strong>{role || 'None (Public)'}</strong></p>
          </div>

          <Link to="/login">
            <button>Login Page</button>
          </Link>

          {/* Buttons with roles*/}
          {(role === 'Admin' || role === 'Receptionist') && (
            <Link to="/create-patient">
              <button>Create Patient</button>
            </Link>
          )}

          <Link to="/appointment">
            <button>Appointments</button>
          </Link>

          {(role === 'Admin' || role === 'Doctor') && (
            <Link to="/vitals">
              <button>Vitals</button>
            </Link>
          )}

          <Link to="/plan">
            <button>Health Plans</button>
          </Link>
        </>
      } />
      <Route path="/login" element={<Login_page />} />
      <Route path="/create-patient" element={<Create_patient />} />
      <Route path="/appointment" element={<Appointment_page />} />
      <Route path="/vitals" element={<Vitals_page />} />
      <Route path="/plan" element={<Plan_page />} />
    </Routes>
  )
}

export default App