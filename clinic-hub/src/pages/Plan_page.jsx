import { useState } from 'react'
import { Link } from 'react-router-dom'

function Plan_page() {
  const [billingData, setBillingData] = useState({
    member_id: '',      // Changed to snake_case
    group_id: '',       // Changed to snake_case
    plan_type: 'PPO',   // Changed to snake_case
    carrier_name: '',   // Changed to snake_case
    effective_date: '', // Changed to snake_case
    copay: ''
  })
 // State for ID Photo
  const [id_photo, setIdPhoto] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setIdPhoto(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }
  const handleChange = (e) => {
    const { name, value } = e.target
    setBillingData(prev => ({ ...prev, [name]: value }))
  }

const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Prepare the data
    // Use FormData when you need to send files (like id_photo)
    const formData = new FormData();
    formData.append('member_id', billingData.member_id);
    formData.append('group_id', billingData.group_id);
    formData.append('plan_type', billingData.plan_type);
    formData.append('carrier_name', billingData.carrier_name);
    formData.append('effective_date', billingData.effective_date);
    formData.append('copay', billingData.copay);
    
    if (id_photo) {
      formData.append('id_photo', id_photo);
    }

    // 2. Get the token from login
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5000/api/billing', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert("✅ Billing information saved successfully!");
        console.log('Server Response:', result);
      } else if (response.status === 403) {
        alert("🚫 Access Denied: Only Receptionists or Admins can save billing info.");
      } else {
        alert("⚠️ Error saving data. Check the server logs.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("❌ Connection Failed: Is your Node server running?");
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    boxSizing: 'border-box',
    borderRadius: '4px',
    border: '1px solid #ccc'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px'
  }

  const groupStyle = {
    marginBottom: '15px'
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '12px', fontFamily: 'Arial, sans-serif'}}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Health Plan Billing Details</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px' }}>Enter the information exactly as it appears on your insurance card.</p>
      
      <form onSubmit={handleSubmit}>
        {/* Insurance Carrier */}
        <div style={groupStyle}>
          <label style={labelStyle}>Insurance Carrier Name:</label>
          <select 
            name="carrier_name"
            value={billingData.carrier_name}
            onChange={handleChange}
            required 
            style={inputStyle}
          >
            <option value="">-- Select Insurance Carrier --</option>
            <option value="BlueCross BlueShield">BlueCross BlueShield</option>
            <option value="Aetna">Aetna</option>
            <option value="UnitedHealthcare">UnitedHealthcare</option>
            <option value="Cigna">Cigna</option>
            <option value="Medicare">Medicare</option>
            <option value="Medicaid">Medicaid</option>
            <option value="Self-Pay">Self-Pay / No Insurance</option>
          </select>
        </div>

        {/* Member ID & Group Number */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Member ID / Policy #:</label>
            <input 
              type="text" 
              name="member_id"
              value={billingData.member_id}
              onChange={handleChange}
              required 
              style={inputStyle} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Group Number:</label>
            <input 
              type="text" 
              name="group_id"
              value={billingData.group_id}
              onChange={handleChange}
              style={inputStyle} 
            />
          </div>
        </div>

        {/* Plan Type & Copay */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Plan Type:</label>
            <select name="plan_type" value={billingData.plan_type} onChange={handleChange} style={inputStyle}>
              <option value="HMO">HMO</option>
              <option value="PPO">PPO</option>
              <option value="EPO">EPO</option>
              <option value="POS">POS</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Standard Copay ($):</label>
            <input 
              type="number" 
              name="copay"
              value={billingData.copay}
              onChange={handleChange}
              placeholder="0.00"
              style={inputStyle} 
            />
          </div>
        </div>

        {/* Effective Date */}
        <div style={groupStyle}>
          <label style={labelStyle}>Effective Date:</label>
          <input 
            type="date" 
            name="effective_date"
            value={billingData.effective_date}
            onChange={handleChange}
            style={inputStyle} 
          />
        </div>
        {/* Insurance PHOTO BOX */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          border: '2px dashed #007bff', 
          borderRadius: '8px', 
          backgroundColor: '#f8fbff',
          textAlign: 'center'
        }}>
          <label style={{ display: 'block', marginBottom: '4px' }}></label>
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
            <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '4px' }}>
              {id_photo ? 'Photo Selected' : 'Upload Insurance Photo'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}></div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </label>

          {previewUrl && (
            <div style={{ marginTop: '15px', position: 'relative' }}>
              <img 
                src={previewUrl} 
                alt="ID Preview" 
                style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #ddd', background: '#fff' }} 
              />
              <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>{id_photo.name}</p>
            </div>
          )}
            
        </div>
        {/*Save and back button */}
        
        <label style={{ display: 'block', marginBottom: '4px' }}></label>
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          Save Billing Information
        </button>
      </form>

      <Link to="/" style={{ textDecoration: 'none' }}>
        <button style={{ width: '100%', marginTop: '12px', padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Go Back Home
        </button>
      </Link>
    </div>
  )
}

export default Plan_page