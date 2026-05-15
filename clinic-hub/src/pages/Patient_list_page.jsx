import { useState, useEffect } from 'react'
import { Search, UserPlus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const PER_PAGE = 10

const Patient_list = () => {
  const [searchTerm, setSearchTerm]       = useState('')
  const [debouncedSearch, setDebounced]   = useState('')
  const [patients, setPatients]           = useState([])
  const [meta, setMeta]                   = useState(null)
  const [loading, setLoading]             = useState(true)
  const [page, setPage]                   = useState(1)
  const [refreshKey, setRefreshKey]       = useState(0)
  const navigate = useNavigate()

  // Debounce: update debouncedSearch AND reset to page 1 in the same batch
  // so the fetch effect only fires once with the correct page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(searchTerm)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch whenever page, debouncedSearch, or refreshKey changes
  useEffect(() => {
    const controller = new AbortController()

    const doFetch = async () => {
      setLoading(true)
      const token = localStorage.getItem('token')
      try {
        const params = new URLSearchParams({ page, per_page: PER_PAGE })
        if (debouncedSearch) params.set('search', debouncedSearch)

        const response = await fetch(`http://localhost:5000/api/patients?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          cache: 'no-store',
        })

        if (response.status === 401) { navigate('/login'); return }
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        setPatients(Array.isArray(data) ? data : (data?.patients ?? []))
        setMeta(data?.pagination ?? null)
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error loading patients:', err)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    doFetch()
    return () => controller.abort()
  }, [page, debouncedSearch, navigate, refreshKey])

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this patient? This action cannot be undone.')) return
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:5000/api/patients/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      if (patients.length === 1 && page > 1) setPage((p) => p - 1)
      else setRefreshKey((k) => k + 1)
    }
  }

  // Build page number buttons: [1, …, 4, 5, 6, …, 12]
  const pageNumbers = () => {
    if (!meta) return []
    const { pages } = meta
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)

    const set = new Set([1, pages, page, page - 1, page + 1].filter((n) => n >= 1 && n <= pages))
    const sorted = [...set].sort((a, b) => a - b)

    const result = []
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
      result.push(sorted[i])
    }
    return result
  }

  const firstItem = meta && meta.total > 0 ? Math.min((page - 1) * PER_PAGE + 1, meta.total) : 0
  const lastItem  = meta ? Math.min(page * PER_PAGE, meta.total) : 0

  return (
    <main className="page-wrapper">
      <div className="page-container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">Patients</h1>
            <p className="page-subtitle">
              {loading
                ? 'Loading…'
                : meta
                  ? `${meta.total} registered patient${meta.total !== 1 ? 's' : ''}`
                  : `${patients.length} patient${patients.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
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
                <UserPlus size={15} aria-hidden="true" /> Add Patient
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
            <>
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
                    {patients.length > 0 ? (
                      patients.map((patient) => (
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
                                <button className="btn btn-sm btn-outline" aria-label={`View record for ${patient.first_name} ${patient.last_name}`}>
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
                              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No patients yet'}
                            </p>
                            <p className="empty-state-text">
                              {debouncedSearch ? 'Try a different name or email.' : 'Add your first patient to get started.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer — only shown when there is more than one page */}
              {meta && meta.pages > 1 && (
                <div
                  className="card-footer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}
                >
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    Showing <strong>{firstItem}–{lastItem}</strong> of <strong>{meta.total}</strong> patients
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }} role="navigation" aria-label="Pagination">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={!meta.has_prev}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={14} aria-hidden="true" />
                    </button>

                    {pageNumbers().map((n, i) =>
                      n === '…' ? (
                        <span
                          key={`ellipsis-${i}`}
                          style={{ padding: '0 var(--space-2)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          className={n === page ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                          onClick={() => setPage(n)}
                          aria-label={`Page ${n}`}
                          aria-current={n === page ? 'page' : undefined}
                          style={{ minWidth: '34px' }}
                        >
                          {n}
                        </button>
                      )
                    )}

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!meta.has_next}
                      aria-label="Next page"
                    >
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default Patient_list
