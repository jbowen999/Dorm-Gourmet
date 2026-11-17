import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function Layout() {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">
          Dorm Gourmet
        </Link>
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
          {/* Render nothing auth-specific until the session check finishes,
              so logged-in users don't see a flash of Login/Register. */}
          {!loading &&
            (user ? (
              <>
                <NavLink to="/recipes/new">Post a Recipe</NavLink>
                <span className="username">{user.username}</span>
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register">Register</NavLink>
              </>
            ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
