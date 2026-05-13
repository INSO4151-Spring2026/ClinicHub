import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, AlertCircle, Heart, Eye, EyeOff } from 'lucide-react'

function Login_page() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('role', data.role)
        localStorage.setItem('userRole', data.role)
        navigate('/')
      } else {
        setError(data.message || 'Invalid email or password. Please try again.')
      }
    } catch {
      setError('Connection error. Please check that the server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="page-wrapper"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div
            style={{ display: 'inline-flex', width: '52px', height: '52px', backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-lg)', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}
            aria-hidden="true"
          >
            <Heart size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
            Sign in to your ClinicHub account
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-body">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }} role="alert" aria-live="assertive">
                <AlertCircle size={15} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate aria-label="Login form">
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email address <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  required
                  autoComplete="email"
                  aria-required="true"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              {/* Password */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="password" className="form-label">
                  Password <span className="required" aria-hidden="true">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    id="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    aria-required="true"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
                      padding: '2px', display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn size={17} aria-hidden="true" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
          <Link to="/" className="btn btn-secondary">← Back to Dashboard</Link>
        </div>
      </div>
    </main>
  )
}

export default Login_page
