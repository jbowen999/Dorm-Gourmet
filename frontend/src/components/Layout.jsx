import { Outlet } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import "./Layout.css";

export default function Layout() {
  return (
    <div className="layout">
      <a className="layout-skip-link" href="#main">
        Skip to content
      </a>
      <NavBar />
      <main id="main" className="layout-main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="layout-footer">
        <p>
          Dorm Gourmet · CS5610 Web Development ·{" "}
          <a href="https://github.com/" rel="noreferrer">
            Source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
