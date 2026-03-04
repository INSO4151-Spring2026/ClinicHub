import { useState } from 'react'
import { Link } from 'react-router-dom'

function Plan_page() {
  const [billingData, setBillingData] = useState({
    memberId: '',
    groupId: '',
    planType: 'PPO',
    carrierName: '',
    effectiveDate: '',
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

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Billing Data Submitted:', billingData)
    // Add logic to save data to your backend here
  }

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
          <input 
            type="text" 
            name="carrierName"
            value={billingData.carrierName}
            onChange={handleChange}
            placeholder="e.g. BlueCross BlueShield"
            required 
            style={inputStyle} 
          />
        </div>

        {/* Member ID & Group Number */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Member ID / Policy #:</label>
            <input 
              type="text" 
              name="memberId"
              value={billingData.memberId}
              onChange={handleChange}
              required 
              style={inputStyle} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Group Number:</label>
            <input 
              type="text" 
              name="groupId"
              value={billingData.groupId}
              onChange={handleChange}
              style={inputStyle} 
            />
          </div>
        </div>

        {/* Plan Type & Copay */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Plan Type:</label>
            <select name="planType" value={billingData.planType} onChange={handleChange} style={inputStyle}>
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
            name="effectiveDate"
            value={billingData.effectiveDate}
            onChange={handleChange}
            style={inputStyle} 
          />
        </div>
{/* --- Insurance PHOTO BOX --- */}
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
              {id_photo ? 'Photo Selected' : 'Upload Identification Photo'}
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
        {/* ------------------------------- */}
        
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