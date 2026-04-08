import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 

const Appointment_page = () => {
  const navigate = useNavigate(); 
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'Consultation',
    date: '',
    time: '',
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Appointment Booked:', formData);
        setSubmitted(true);
      } else if (response.status === 403) {
        alert("🚫 Access Denied: You don't have permission to book appointments.");
      } else {
        alert("⚠️ Error: Could not save appointment.");
      }
    } catch (err) {
      console.error("Connection error:", err);
      alert("❌ Connection Failed: Is your Node server running on port 5000?");
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Success! 🎉</h2>
        <p>Your appointment for {formData.service} on {formData.date} at {formData.time} is confirmed.</p>
        <button onClick={() => setSubmitted(false)} style={buttonStyle}>Book Another</button>
        {/* navigation to success screen */}
        <button onClick={() => navigate('/')} style={backButtonStyle}>Go Back Home</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Schedule an Appointment</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Name label */}
        <label>
          Full Name:
          <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
        </label>
        {/* Email label */}
        <label>
          Email:
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
        </label>
        {/* Service dropdown */}
        <label>
          Service:
          <select name="service" value={formData.service} onChange={handleChange} style={inputStyle}>
            <option value="Consultation">Consultation</option>
            <option value="General Checkup">General Checkup</option>
            <option value="Follow-up">Follow-up</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ flex: 1 }}>
            Date:
            <input type="date" name="date" value={formData.date} onChange={handleChange} required style={inputStyle} />
          </label>
          <label style={{ flex: 1 }}>
            Time:
            <input type="time" name="time" value={formData.time} onChange={handleChange} required style={inputStyle} />
          </label>
        </div>
        {/* Notes text area */}
        <label>
          Notes (Optional):
          <textarea name="notes" value={formData.notes} onChange={handleChange} style={{ ...inputStyle, height: '80px' }} />
        </label>

        <button type="submit" style={buttonStyle}>Confirm Booking</button>
      </form>

      {/* 3. Use navigate('/') on click */}
      <button 
        onClick={() => navigate('/')} 
        style={{ ...backButtonStyle, width: '100%', marginTop: '20px', marginLeft: '0' }}
      >
         Cancel and Go Home
      </button>
    </div>
  );
};

// Styles 
const inputStyle = { 
    width: '100%', 
    padding: '8px', 
    marginTop: '5px', 
    borderRadius: '4px', 
    border: '1px solid #ccc', 
    boxSizing: 'border-box' 
};

const buttonStyle = { 
    backgroundColor: '#28a745', 
    color: 'white', 
    padding: '10px', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontSize: '16px' 
};


const backButtonStyle = { 
    backgroundColor: '#6c757d', 
    color: 'white', 
    padding: '10px', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontSize: '16px',
    marginLeft: '10px' 
};

export default Appointment_page;