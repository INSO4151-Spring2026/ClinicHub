import { useState } from 'react'
import { Link } from 'react-router-dom'

function Create_patient() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [sex, setSex] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const patient = { firstName, lastName, dob, sex, email, phone, address, emergencyPhone }
    console.log('Create patient:', patient)
    // TODO: send `patient` to your API
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1>Create Patient</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label>First Name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label>Last Name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Date of Birth</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Sex</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)} required style={{ width: '100%', padding: '8px' }}>
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Emergency Contact Phone</label>
          <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>

        <button type="submit" style={{ marginTop: '16px', padding: '10px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Create
        </button>
      </form>

      <Link to="/">
        <button style={{ display: 'block', marginTop: '10px', padding: '10px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
          Back Home
        </button>
      </Link>
    </div>
  )
}

export default Create_patient
