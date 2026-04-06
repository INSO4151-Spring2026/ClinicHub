import { useState } from 'react'
import { Link } from 'react-router-dom'

function Create_patient() {
  const [first_name, set_first_name] = useState('')
  const [last_name, set_last_name] = useState('')
  const [last_name_2, set_last_name_2] = useState('')
  const [dob, set_Dob] = useState('')
  const [sex, set_sex] = useState('')
  const [email, set_email] = useState('')
  const [phone, set_phone] = useState('')
  const [address, set_address] = useState('')
  const [emergency_name, set_emergency_name] = useState('')
  const [emergency_phone, set_emergency_phone] = useState('')
  
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

const handleSubmit = async (e) => {
    e.preventDefault();

    // Using FormData to handle the text and the ID photo file
    const formData = new FormData();
    formData.append('first_name', first_name);
    formData.append('last_name', last_name);
    formData.append('last_name_2', last_name_2);
    formData.append('dob', dob);
    formData.append('sex', sex);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('address', address);
    formData.append('emergency_name', emergency_name);
    formData.append('emergency_phone', emergency_phone);
    
    if (id_photo) {
      formData.append('id_photo', id_photo);
    }

    // Get the token from localStorage
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: {
          
          'Authorization': `Bearer ${token}` 
        },
        body: formData,
      });

      if (response.ok) {
        alert("✅ Patient created successfully!");
        // Resetting form or redirecting could go here
      } else if (response.status === 403) {
        alert("🚫 Access Denied: You don't have permission to create patients.");
      } else {
        alert("⚠️ Error: Could not save patient.");
      }
    } catch (err) {
      console.error("Connection error:", err);
      alert("❌ Connection Failed: Is the server running?");
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h1>Create Patient</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* First Name div */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>First Name</label>
            <input value={first_name} onChange={(e) => set_first_name(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          {/* Last Name div */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>Last Name</label>
            <input value={last_name} onChange={(e) => set_last_name(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
        </div>
        {/* Second Last Name div */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Second Last Name</label>
          <input value={last_name_2} onChange={(e) => set_last_name_2(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        {/* Date of Birth div */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Date of Birth</label>
          <input type="date" value={dob} onChange={(e) => set_Dob(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        {/* Sex dropdown div */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Sex</label>
          <select value={sex} onChange={(e) => set_sex(e.target.value)} required style={{ width: '100%', padding: '8px' }}>
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
        {/* Email div */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Email</label>
          <input type="email" value={email} onChange={(e) => set_email(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        {/* Phone div */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Phone</label>
          <input value={phone} onChange={(e) => set_phone(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        {/* Address div */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Address</label>
          <input value={address} onChange={(e) => set_address(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        {/* Emergency Contact Name div */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Emergency Contact Name</label>
          <input value={emergency_name} onChange={(e) => set_emergency_name(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        {/* Emergency Contact Phone div */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Emergency Contact Phone</label>
          <input value={emergency_phone} onChange={(e) => set_emergency_phone(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        {/* --- IDENTIFICATION PHOTO BOX --- */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          border: '2px dashed #007bff', 
          borderRadius: '8px', 
          backgroundColor: '#f8fbff',
          textAlign: 'center'
        }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Date of Birth</label>
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
        {/* Submit Button and go back*/}
        <button type="submit" style={{ marginTop: '24px', width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Create Patient
        </button>
      </form>

      <Link to="/" style={{ textDecoration: 'none' }}>
        <button style={{ display: 'block', width: '100%', marginTop: '10px', padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
         Go Back Home
        </button>
      </Link>
    </div>
  )
}

export default Create_patient