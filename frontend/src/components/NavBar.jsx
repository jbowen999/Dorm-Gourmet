import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import "./NavBar.css";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/recipes", label: "Recipes" },
  { to: "/reviews", label: "Reviews" },
];

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  async function handleLogout() {
    closeMenu();
    // logout() clears the user even if the request fails.
    await logout().catch(() => {});
    navigate("/");
  }

  return (
    <header className="navbar">
      <nav className="navbar-inner" aria-label="Main">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span aria-hidden="true">🍳</span> Dorm Gourmet
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="visually-hidden">Menu</span>
          <span aria-hidden="true">☰</span>
        </button>

        <div
          id="navbar-menu"
          className={`navbar-menu ${menuOpen ? "is-open" : ""}`}
        >
          <ul className="navbar-links">
            {LINKS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className="navbar-link"
                  onClick={closeMenu}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar-account">
            {/* Nothing auth-specific until the session check finishes, so
                logged-in users don't see a flash of Log in / Sign up. */}
            {loading ? null : user ? (
              <>
                <Link to="/recipes/new" className="btn" onClick={closeMenu}>
                  Post a Recipe
                </Link>
                <span className="navbar-greeting">Hi, {user.username}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-secondary"
                  onClick={closeMenu}
                >
                  Log in
                </Link>
                <Link to="/register" className="btn" onClick={closeMenu}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
