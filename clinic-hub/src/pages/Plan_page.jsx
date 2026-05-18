import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Camera, CheckCircle, AlertCircle } from 'lucide-react'

const CARRIERS = [
  'BlueCross BlueShield', 'Aetna', 'UnitedHealthcare',
  'Cigna', 'Medicare', 'Medicaid', 'Self-Pay / No Insurance',
]

const PLAN_TYPES = ['HMO', 'PPO', 'EPO', 'POS']

function Plan_page() {
  const navigate = useNavigate()

  const [billing, setBilling] = useState({
    member_id: '', group_id: '', plan_type: 'PPO',
    carrier_name: '', effective_date: '', copay: '',
  })
  const [id_photo, setIdPhoto]   = useState(null)
  const [previewUrl, setPreview] = useState(null)
  const [loading, setLoading]    = useState(false)
  const [error, setError]        = useState('')

  const set = (key) => (e) =>
    setBilling((b) => ({ ...b, [key]: e.target.value }))

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setIdPhoto(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    Object.entries(billing).forEach(([k, v]) => formData.append(k, v))
    if (id_photo) formData.append('id_photo', id_photo)

    const token = localStorage.getItem('token')

    try {
      const response = await fetch('http://localhost:5000/api/billing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (response.ok) {
        navigate('/')
      } else if (response.status === 403) {
        setError('Access denied: Only Receptionists or Admins can save billing information.')
      } else {
        setError('Could not save billing information. Please check your input.')
      }
    } catch {
      setError('Connection failed. Is the Node server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrapper">
      <div className="page-container-sm">
        <div className="page-header">
          <h1 className="page-title">Health Plan Billing</h1>
          <p className="page-subtitle">Enter information exactly as it appears on the insurance card.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }} role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate aria-label="Health plan billing form">
          {/* Carrier */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="card-header">
              <h2 className="card-title">Insurance Carrier</h2>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="carrier_name" className="form-label">
                  Carrier Name <span className="required" aria-hidden="true">*</span>
                </label>
                <select
                  id="carrier_name" className="form-select"
                  value={billing.carrier_name} onChange={set('carrier_name')}
                  required aria-required="true"
                >
                  <option value="">— Select insurance carrier —</option>
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="card-header">
              <h2 className="card-title">Plan Details</h2>
            </div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="member_id" className="form-label">
                    Member ID / Policy # <span className="required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="member_id" className="form-input"
                    value={billing.member_id} onChange={set('member_id')}
                    required aria-required="true"
                    placeholder="e.g. XYZ123456789"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="group_id" className="form-label">Group Number</label>
                  <input
                    id="group_id" className="form-input"
                    value={billing.group_id} onChange={set('group_id')}
                    placeholder="e.g. GRP001"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="plan_type" className="form-label">Plan Type</label>
                  <select
                    id="plan_type" className="form-select"
                    value={billing.plan_type} onChange={set('plan_type')}
                  >
                    {PLAN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="copay" className="form-label">Standard Copay ($)</label>
                  <input
                    type="number" id="copay" className="form-input"
                    value={billing.copay} onChange={set('copay')}
                    min="0" step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group form-col-2" style={{ marginBottom: 0 }}>
                  <label htmlFor="effective_date" className="form-label">Effective Date</label>
                  <input
                    type="date" id="effective_date" className="form-input"
                    value={billing.effective_date} onChange={set('effective_date')}
                  />
                </div>
              </div>
            </div>
          </div>

         

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button
              type="submit"
              className="btn btn-success btn-full btn-lg"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} aria-hidden="true" />
                  Saving…
                </>
              ) : (
                <>
                  <ShieldCheck size={17} aria-hidden="true" />
                  Save Billing Information
                </>
              )}
            </button>

            <Link to="/" tabIndex={-1}>
              <button type="button" className="btn btn-secondary btn-full">← Back to Dashboard</button>
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

export default Plan_page
