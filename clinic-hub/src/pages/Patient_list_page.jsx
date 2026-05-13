import { useState, useEffect } from 'react'
import { Search, UserPlus, Trash2, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const Patient_list = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients]     = useState([])
  const [loading, setLoading]       = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem('token')
      try {
        const response = await fetch('http://localhost:5000/api/patients', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.status === 401) { navigate('/login'); return }

        const data = await response.json()
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.patients) ? data.patients : []
        setPatients(normalized)
      } catch (err) {
        console.error('Error loading patients:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [navigate])

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this patient? This action cannot be undone.')) return

    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:5000/api/patients/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      setPatients((prev) => prev.filter((p) => p.patient_id !== id))
    } else {
      console.error('Delete failed')
    }
  }

  const filtered = patients.filter((p) => {
    const q = searchTerm.toLowerCase()
    return (
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    )
  })

  return (
    <main className="page-wrapper">
      <div className="page-container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">Patients</h1>
            <p className="page-subtitle">
              {loading ? 'Loading…' : `${patients.length} registered patient${patients.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="search-wrapper" style={{ width: '260px' }}>
              <Search size={15} className="search-icon" aria-hidden="true" />
              <input
                type="search"
                className="form-input search-input"
                placeholder="Search by name or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search patients"
              />
            </div>

            <Link to="/create-patient" tabIndex={-1}>
              <button className="btn btn-primary" aria-label="Add new patient">
                <UserPlus size={15} aria-hidden="true" />
                Add Patient
              </button>
            </Link>
          </div>
        </div>

        {/* Table card */}
        <div className="card">
          {loading ? (
            <div className="loading-state" role="status" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              Loading patients…
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table" role="grid" aria-label="Patient list">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Phone</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((patient) => (
                      <tr key={patient.patient_id}>
                        <td>
                          <span className="badge badge-gray">#{patient.patient_id}</span>
                        </td>
                        <td style={{ fontWeight: 'var(--font-medium)' }}>
                          {patient.first_name} {patient.last_name}
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{patient.email || '—'}</td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{patient.phone || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                            <Link to={`/records/${patient.patient_id}`} tabIndex={-1}>
                              <button
                                className="btn btn-sm btn-outline"
                                aria-label={`View record for ${patient.first_name} ${patient.last_name}`}
                              >
                                View <ChevronRight size={13} aria-hidden="true" />
                              </button>
                            </Link>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(patient.patient_id)}
                              aria-label={`Delete ${patient.first_name} ${patient.last_name}`}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <div className="empty-state-icon" aria-hidden="true">🔍</div>
                          <p className="empty-state-title">
                            {searchTerm ? `No results for "${searchTerm}"` : 'No patients yet'}
                          </p>
                          <p className="empty-state-text">
                            {searchTerm
                              ? 'Try a different name or email address.'
                              : 'Add your first patient to get started.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default Patient_list
