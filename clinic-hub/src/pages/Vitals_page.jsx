import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom' 

function Vitals_page() {
  const navigate = useNavigate(); 

  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [bmi, setBmi] = useState('')
  const [bmi_category, setBmiPercentage] = useState('')
  const [bp, setBp] = useState('')
  const [temperature, setTemperature] = useState('')
  const [pulse, setPulse] = useState('')
  const [respiratory_rate, setRespiratoryRate] = useState('')
  const [o2_saturation, setO2Saturation] = useState('')
  const [pain_level, setPainLevel] = useState('0') 
  const [head_circumference, setHeadCircumference] = useState('')

useEffect(() => {
  if (height && weight) {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (h > 0) {
      const calculatedBmi = (w / (h * h)).toFixed(2)
      setBmi(calculatedBmi)
      
      // Determine the Medical Category
      let category = ''
      if (calculatedBmi < 18.5) category = 'Underweight'
      else if (calculatedBmi < 25) category = 'Normal'
      else if (calculatedBmi < 30) category = 'Overweight'
      else category = 'Obese'
      
      setBmiPercentage(category) 
    }
  } else {
    setBmi('')
    setBmiPercentage('')
  }
}, [height, weight])

const handleSubmit = async (e) => {
  e.preventDefault();

  const vitals = {
    height, weight, bmi, bmi_category, 
    bp, temperature, pulse, respiratory_rate, 
    o2_saturation, pain_level, head_circumference 
  };

  const token = localStorage.getItem('token');

  try {
      const response = await fetch('http://localhost:5000/api/vitals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(vitals),
      });

      if (response.ok) {
        alert("✅ Vitals saved successfully!");
        navigate('/'); 
      } else if (response.status === 401) {
        alert("⚠️ You are not logged in.");
      } else if (response.status === 403) {
        alert("🚫 Access Denied: Only Doctors can save vitals.");
      }
    } catch (err) {
      alert("❌ Connection Failed. Check if the server is running.");
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Patient Vitals</h1>
      <form onSubmit={handleSubmit}>
        
        {/* Physical Measurements Row */}
        <h3 style={{ fontSize: '1rem', color: '#555' }}>Measurements</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {/* Height div */}
          <div>
            <label>Height (m)</label>
            <input type="number" step="0.01" value={height} onChange={(e) => setHeight(e.target.value)} style={inputStyle} required />
          </div>
          {/* Wheight div */}
          <div>
            <label>Weight (kg)</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} required />
          </div>
          {/* Bmi div */}
          <div>
            <label>BMI</label>
            <input value={bmi} readOnly style={readOnlyStyle} />
          </div>
          {/* Bmi category div */}
          <div>
            <label>Category</label>
            <input 
              value={bmi_category} 
              readOnly 
              style={{ ...readOnlyStyle, color: 'white', fontWeight: 'bold', textAlign: 'center' }} 
            />
          </div>
          {/* Head circumference div */}
          <div style={{ marginTop: '12px', width: '100%' }}>
              <label>Head Circ. (cm)</label>
              <input type="number" value={head_circumference} onChange={(e) => setHeadCircumference(e.target.value)} style={inputStyle} required />
          </div>
        </div>

        {/* Vital Signs Row 1 */}
        <h3 style={{ fontSize: '1rem', color: '#555' }}>Vitals</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {/* Bp div */}
          <div>
            <label>BP (mmHg)</label>
            <input placeholder="120/80" value={bp} onChange={(e) => setBp(e.target.value)} style={inputStyle} required />
          </div>
          {/* Temp div */}
          <div>
            <label>Temp (°C)</label>
            <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} style={inputStyle} required />
          </div>
          {/* Pulse div */}
          <div>
            <label>Pulse (bpm)</label>
            <input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} style={inputStyle} required />
          </div>
        </div>

        {/* Vital Signs Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
          {/* Respiratory rate div */}
          <div>
            <label>Resp. Rate</label>
            <input type="number" value={respiratory_rate} onChange={(e) => setRespiratoryRate(e.target.value)} style={inputStyle} required />
          </div>
          {/* O2 Saturation div */}
          <div>
            <label>O2 Sat (%)</label>
            <input type="number" value={o2_saturation} onChange={(e) => setO2Saturation(e.target.value)} style={inputStyle} required />
          </div>
          {/* Pain div */}
          <div>
            <label>Pain (0-10)</label>
            <input 
              type="number" 
              min="0" 
              max="10" 
              value={pain_level} 
              onChange={(e) => setPainLevel(e.target.value)} 
              placeholder="0"
              style={inputStyle} 
              required
            />
          </div>
        </div>

        {/* Additional Info Row */}


        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' }}>
            <button type="submit" style={saveButtonStyle}>
              Save Vitals
            </button>
            
            <Link to="/" style={{ textDecoration: 'none' }}>
                <button type="button" style={backButtonStyle}>
                  Go Back Home
                </button>
            </Link>
        </div>
      </form>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' };
const readOnlyStyle = { width: '100%', padding: '8px', backgroundColor: '#555', color: '#eee', border: '1px solid #ccc', boxSizing: 'border-box' };
const saveButtonStyle = { width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };
const backButtonStyle = { width: '100%', padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };

export default Vitals_page;