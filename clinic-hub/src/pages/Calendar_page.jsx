import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from 'lucide-react'

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const Calendar_page = () => {
  const navigate = useNavigate()
  const today    = new Date()

  const [selectedDay,  setSelectedDay]  = useState(today.getDate())
  const [monthIndex,   setMonthIndex]   = useState(today.getMonth())
  const [year,         setYear]         = useState(today.getFullYear())
  const [appointments, setAppointments] = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const fetchAppointments = async () => {
      const token = localStorage.getItem('token')
      try {
        const response = await fetch('http://localhost:5000/api/appointments', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Failed to fetch')

        const raw = await response.json()
        const rawData = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.appointments) ? raw.appointments : []

        setAppointments(rawData.map((appt) => {
          const d = new Date(appt.scheduled_start)
          return {
            id:      appt.appointment_id,
            time:    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            patient: `Patient #${appt.patient_id}`,
            type:    appt.reason,
            day:     d.getDate(),
            month:   d.getMonth(),
            year:    d.getFullYear(),
          }
        }))
      } catch (err) {
        console.error('Error loading appointments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [])

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this appointment?')) return
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) setAppointments((a) => a.filter((ap) => ap.id !== id))
    } catch {
      alert('Delete failed.')
    }
  }

  const goToday = () => {
    setYear(today.getFullYear())
    setMonthIndex(today.getMonth())
    setSelectedDay(today.getDate())
  }

  /* Build grid (6 rows × 7 cols = 42 cells) */
  const daysInMonth    = new Date(year, monthIndex + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay()
  const cells          = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length < 42) cells.push(null)

  const selectedAppts = appointments.filter(
    (a) => a.day === selectedDay && a.month === monthIndex && a.year === year
  )

  const isToday = (day) =>
    day === today.getDate() &&
    monthIndex === today.getMonth() &&
    year === today.getFullYear()

  return (
    <main className="page-wrapper">
      <div className="page-container-md">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h1 className="page-title">Clinic Schedule</h1>
            <p className="page-subtitle">{MONTHS[monthIndex]} {year}</p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={goToday} aria-label="Go to today">Today</button>

            {/* Month stepper */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <button
                onClick={() => setMonthIndex((m) => (m === 0 ? 11 : m - 1))}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 0, border: 'none', borderRight: '1px solid var(--color-border)' }}
                aria-label="Previous month"
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ padding: '0 var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', minWidth: '90px', textAlign: 'center' }}>
                {MONTHS[monthIndex]}
              </span>
              <button
                onClick={() => setMonthIndex((m) => (m === 11 ? 0 : m + 1))}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 0, border: 'none', borderLeft: '1px solid var(--color-border)' }}
                aria-label="Next month"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Year stepper */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <button
                onClick={() => setYear((y) => y - 1)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 0, border: 'none', borderRight: '1px solid var(--color-border)' }}
                aria-label="Previous year"
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ padding: '0 var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', minWidth: '52px', textAlign: 'center' }}>
                {year}
              </span>
              <button
                onClick={() => setYear((y) => y + 1)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 0, border: 'none', borderLeft: '1px solid var(--color-border)' }}
                aria-label="Next year"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => navigate('/appointment')}>
              <Plus size={14} aria-hidden="true" /> New Appointment
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }}>
          {/* Calendar grid */}
          <div className="card">
            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 'var(--space-2)' }}>
                {DAY_ABBR.map((d) => (
                  <div key={d} className="cal-day-header">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />

                  const hasAppt = appointments.some(
                    (a) => a.day === day && a.month === monthIndex && a.year === year
                  )
                  const selected  = day === selectedDay
                  const todayCell = isToday(day)

                  let cls = 'cal-day-cell'
                  if (selected)  cls += ' selected'
                  if (hasAppt)   cls += ' has-appt'

                  return (
                    <div
                      key={i}
                      className={cls}
                      onClick={() => setSelectedDay(day)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${MONTHS[monthIndex]} ${day}${hasAppt ? ', has appointments' : ''}${selected ? ', selected' : ''}`}
                      aria-pressed={selected}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedDay(day)}
                      style={todayCell && !selected ? { fontWeight: 700, color: 'var(--color-primary)' } : undefined}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Agenda panel */}
          <div className="card" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ flexShrink: 0 }}>
              <div>
                <h2 className="card-title" style={{ fontSize: 'var(--text-sm)' }}>
                  {MONTHS[monthIndex]} {selectedDay}, {year}
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {selectedAppts.length} appointment{selectedAppts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
              {loading ? (
                <div className="loading-state" style={{ padding: 'var(--space-8) var(--space-4)' }} role="status">
                  <span className="loading-spinner" aria-hidden="true" />
                </div>
              ) : selectedAppts.length > 0 ? (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }} role="list">
                  {selectedAppts.map((appt) => (
                    <li
                      key={appt.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    >
                      <div style={{ flexShrink: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-primary)', minWidth: '52px' }}>
                        {appt.time}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {appt.patient}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {appt.type}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(appt.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px', flexShrink: 0 }}
                        aria-label={`Remove appointment at ${appt.time}`}
                      >
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
                  <CalendarDays size={28} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }} aria-hidden="true" />
                  <p className="empty-state-text">No appointments on this day</p>
                </div>
              )}
            </div>

            <div className="card-footer">
              <button
                className="btn btn-primary btn-full btn-sm"
                onClick={() => navigate('/appointment')}
              >
                <Plus size={13} aria-hidden="true" /> New Appointment
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-5)' }}>
          <Link to="/" tabIndex={-1}>
            <button className="btn btn-secondary">← Back to Dashboard</button>
          </Link>
        </div>
      </div>
    </main>
  )
}

export default Calendar_page
