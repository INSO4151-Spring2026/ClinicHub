import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Vitals_page() {
  // State for each vital sign
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [bmi, setBmi] = useState('')
  const [bmi_percentage, setBmiPercentage] = useState('')
  const [bp, setBp] = useState('')
  const [temperature, setTemperature] = useState('')
  const [pulse, setPulse] = useState('')
  const [respiratory_rate, setRespiratoryRate] = useState('')
  const [o2_saturation, setO2Saturation] = useState('')
  const [pain_level, setPainLevel] = useState('0')
  const [head_circumference, setHeadCircumference] = useState('')

  // Automatically calculate BMI when height or weight changes
  useEffect(() => {
    if (height && weight) {
      const h = parseFloat(height)
      const w = parseFloat(weight)
      if (h > 0) {
        const calculatedBmi = (w / (h * h)).toFixed(2)
        setBmi(calculatedBmi)
      }
    } else {
      setBmi('')
    }
  }, [height, weight])

  const handleSubmit = (e) => {
    e.preventDefault()
    const vitals = {
      height, weight, bmi, bmi_percentage, 
      bp, temperature, pulse, respiratory_rate, 
      o2_saturation, pain_level, head_circumference 
    }
    console.log('Record Vitals:', vitals)
    // TODO: send `vitals` to your API
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Patient Vitals</h1>
      <form onSubmit={handleSubmit}>
        
        {/* Physical Measurements Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label>Height (m)</label>
            <input type="number" step="0.01" value={height} onChange={(e) => setHeight(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label>Weight (kg)</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label>BMI</label>
            <input value={bmi} readOnly style={{ width: '100%', padding: '8px'}} />
          </div>
          <div>
            <label>BMI %</label>
            <input value={bmi_percentage} onChange={(e) => setBmiPercentage(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
        </div>

        {/* Vital Signs Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>
            <label>BP (mmHg)</label>
            <input placeholder="120/80" value={bp} onChange={(e) => setBp(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label>Temp (°C)</label>
            <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label>Pulse (bpm)</label>
            <input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
        </div>

        {/* Vital Signs Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>
            <label>Resp. Rate</label>
            <input type="number" value={respiratory_rate} onChange={(e) => setRespiratoryRate(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label>O2 Sat (%)</label>
            <input type="number" value={o2_saturation} onChange={(e) => setO2Saturation(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label>Head Circ. (cm)</label>
            <input type="number" value={head_circumference} onChange={(e) => setHeadCircumference(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
        </div>

        {/* Pain Level */}
        <div style={{ marginTop: '12px' }}>
          <label>Pain Level (0-10): <strong>{pain_level}</strong></label>
          <input 
            type="range" min="0" max="10" 
            value={pain_level} 
            onChange={(e) => setPainLevel(e.target.value)} 
            style={{ width: '100%', marginTop: '8px' }} 
          />
        </div>

        <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Save Vitals
        </button>
      </form>

      <Link to="/">
        <button style={{ display: 'block', marginTop: '10px', padding: '10px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Back Home
        </button>
      </Link>
    </div>
  )
}

export default Vitals_page