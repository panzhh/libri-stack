import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  // --- AUTH LOGIC ---
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear(); // Wipes token, role, and name
    navigate("/login"); // Redirects to login
  };

  // Increased font weight and set base size to text-sm
  const linkStyles = ({ isActive }) =>
    `transition-all hover:text-indigo-600 text-sm tracking-wide ${
      isActive ? "text-indigo-600 font-black" : "text-slate-600 font-bold"
    }`;

  return (
    <nav className='max-w-7xl mx-auto p-8 flex justify-between items-center bg-white mb-4 rounded-b-[2rem] shadow-sm border-b border-slate-50'>
      <Link
        to='/'
        className='text-2xl font-black italic tracking-tighter uppercase'
      >
        Church in Dunn Loring <span className='text-indigo-600'>Library</span>
      </Link>

      {/* Changed text-[10px] to text-sm and increased gap for better legibility */}
      <div className='flex items-center gap-8 text-sm uppercase tracking-wider'>
        <NavLink title='Home' to='/' className={linkStyles}>
          Home
        </NavLink>

        <NavLink title='About' to='/about' className={linkStyles}>
          About
        </NavLink>

        <NavLink title='Contact' to='/contact' className={linkStyles}>
          Contact
        </NavLink>

        {/* --- CONDITIONAL RENDERING --- */}
        {!token ? (
          <>
            <NavLink title='Register' to='/register' className={linkStyles}>
              Register
            </NavLink>

            <NavLink
              to='/login'
              className={({ isActive }) =>
                `px-6 py-2.5 rounded-full font-black transition-all text-sm ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 text-white hover:bg-indigo-600"
                }`
              }
            >
              Login
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to={role === "admin" ? "/admin-dashboard" : "/user-dashboard"}
              className={linkStyles}
            >
              Dashboard
            </NavLink>

            <div className='flex items-center gap-6 ml-4 pl-6 border-l-2 border-slate-100'>
              <span className='text-slate-500 font-bold tracking-tight italic normal-case text-base'>
                Hi, {userName || "User"}
              </span>
              <button
                onClick={handleLogout}
                className='px-6 py-2.5 rounded-full bg-rose-50 text-rose-600 font-black text-sm hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm'
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
