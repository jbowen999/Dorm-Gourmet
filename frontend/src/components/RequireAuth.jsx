import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

// Gates a route behind login. Remembers where the user was headed so the
// login page can send them back there afterwards.
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="loading">Loading…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
}
