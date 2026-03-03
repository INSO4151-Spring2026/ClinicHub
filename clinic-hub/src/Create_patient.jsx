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

  const handleSubmit = (e) => {
    e.preventDefault()
    const patient = { first_name, last_name, dob, sex, email, phone, address, emergency_phone }
    console.log('Create patient:', patient)
    // TODO: send `patient` to your API
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1>Create Patient</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label>First Name</label>
            <input value={first_name} onChange={(e) => set_first_name(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label>Last Name</label>
            <input value={last_name} onChange={(e) => set_last_name(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
        <div>
        <label>Last Name</label>
        <input value={last_name_2} onChange={(e) => set_last_name_2(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Date of Birth</label>
          <input type="date" value={dob} onChange={(e) => set_Dob(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Sex</label>
          <select value={sex} onChange={(e) => set_sex(e.target.value)} required style={{ width: '100%', padding: '8px' }}>
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => set_email(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Phone</label>
          <input value={phone} onChange={(e) => set_phone(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>Address</label>
          <input value={address} onChange={(e) => set_address(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <label>Emergency Contact Name</label>
          <input value={emergency_name} onChange={(e) => set_emergency_name(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <label>Emergency Contact Phone</label>
          <input value={emergency_phone} onChange={(e) => set_emergency_phone(e.target.value)} style={{ width: '100%', padding: '8px' }} />
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
