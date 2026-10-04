import React, { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL, authHeaders } from "../api";

export default function Navbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // --- AUTH LOGIC ---
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");
  const role = localStorage.getItem("role");

  // Unread messages: refreshed on every page change, when the Messages page
  // reports a change, and every minute
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!token) return; // the link is hidden when logged out
    const refresh = () =>
      fetch(`${API_URL}/api/messages/unread-count`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : { unread: 0 }))
        .then((d) => setUnread(d.unread || 0))
        .catch(() => {});
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("messages-changed", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("messages-changed", refresh);
    };
  }, [token, location.pathname]);

  const handleLogout = () => {
    localStorage.clear(); // Wipes token, role, and name
    navigate("/login");
  };

  // Search from any page: show the results in the Home page catalog
  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}#catalog` : "/#catalog");
  };

  const linkStyles = ({ isActive }) =>
    `px-1 py-1 text-base font-bold transition-colors hover:text-gb-darker ${
      isActive ? "text-black underline underline-offset-4" : "text-black"
    }`;

  return (
    <header>
      {/* Top bar: name, search, account */}
      <div className="bg-gb-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            to="/"
            className="font-serif text-xl sm:text-2xl leading-tight text-black"
          >
            Church in Dunn Loring{" "}
            <span className="font-bold text-gb-darker">Library</span>
          </Link>

          <form
            onSubmit={handleSearch}
            role="search"
            className="order-last w-full md:order-none md:w-auto md:flex-1 md:max-w-xl flex"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books by title or author"
              aria-label="Search books"
              className="flex-1 min-w-0 bg-white text-black text-base px-4 py-2.5 rounded-l-full outline-none placeholder:text-gb-muted focus:ring-2 focus:ring-gb-dark"
            />
            <button
              type="submit"
              className="bg-gb-dark hover:bg-gb-darker text-white font-bold px-5 rounded-r-full"
            >
              Go!
            </button>
          </form>

          <div className="ml-auto flex items-center gap-3">
            {!token ? (
              <>
                <Link to="/register" className="gb-btn-light py-2">
                  Register
                </Link>
                <Link to="/login" className="gb-btn py-2">
                  Log in
                </Link>
              </>
            ) : (
              <>
                <span className="hidden sm:inline text-base font-semibold text-black">
                  Hi, {userName?.split(" ")[0] || "User"}
                </span>
                <button onClick={handleLogout} className="gb-btn py-2">
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Menu row */}
      <nav className="bg-gb-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-8 gap-y-1">
          <NavLink to="/" end className={linkStyles}>
            Home
          </NavLink>
          <NavLink to="/about" className={linkStyles}>
            About
          </NavLink>
          <NavLink to="/contact" className={linkStyles}>
            Contact
          </NavLink>
          {token && (
            <NavLink to="/messages" className={linkStyles}>
              Messages
              {unread > 0 && (
                <span
                  className="ml-1.5 inline-block min-w-6 px-1.5 rounded-full bg-gb-red text-white text-sm text-center no-underline"
                  aria-label={`${unread} unread`}
                >
                  {unread}
                </span>
              )}
            </NavLink>
          )}
          {token && role === "admin" && (
            <NavLink to="/admin-dashboard" className={linkStyles}>
              Admin Panel
            </NavLink>
          )}
          {token && (
            <NavLink to="/user-dashboard" className={linkStyles}>
              {role === "admin" ? "My Borrows" : "My Dashboard"}
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}
