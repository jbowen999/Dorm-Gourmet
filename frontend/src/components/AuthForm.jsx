import PropTypes from 'prop-types'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Shared username/password form for the login and register pages.
export default function AuthForm({ title, submitLabel, onSubmit }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Set by RequireAuth when it redirected here from a protected page.
  const from = location.state?.from
  const redirectTo = from ? from.pathname + from.search : '/'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(username, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1>{title}</h1>
      {error && <p className="error">{error}</p>}
      <label>
        Username
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={
            submitLabel === 'Register' ? 'new-password' : 'current-password'
          }
          required
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Please wait…' : submitLabel}
      </button>
    </form>
  )
}

AuthForm.propTypes = {
  title: PropTypes.string.isRequired,
  submitLabel: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
}
