import React, { useState } from 'react';

const Appointment_page = () => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd send formData to your API here
    console.log('Appointment Booked:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Success! 🎉</h2>
        <p>Your appointment for {formData.service} on {formData.date} at {formData.time} is confirmed.</p>
        <button onClick={() => setSubmitted(false)}>Book Another</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Schedule an Appointment</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <label>
          Full Name:
          <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
        </label>

        <label>
          Email:
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
        </label>

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

        <label>
          Notes (Optional):
          <textarea name="notes" value={formData.notes} onChange={handleChange} style={{ ...inputStyle, height: '80px' }} />
        </label>

        <button type="submit" style={buttonStyle}>Confirm Booking</button>
      </form>
    </div>
  );
};

// Simple inline styles
const inputStyle = {
  width: '100%',
  padding: '8px',
  marginTop: '5px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box'
};

const buttonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '10px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px'
};

export default Appointment_page;