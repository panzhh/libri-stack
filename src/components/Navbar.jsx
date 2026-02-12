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

  const linkStyles = ({ isActive }) =>
    `transition-all hover:text-indigo-600 ${
      isActive ? "text-indigo-600 font-black" : "text-slate-600 font-bold"
    }`;

  return (
    <nav className='max-w-7xl mx-auto p-6 flex justify-between items-center bg-white mb-4 rounded-b-[2rem] shadow-sm'>
      <Link
        to='/'
        className='text-2xl font-black italic tracking-tighter uppercase'
      >
        Libri<span className='text-indigo-600'>Stack</span>
      </Link>

      <div className='flex items-center gap-6 text-[10px] uppercase tracking-widest'>
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
            {/* Show these when LOGGED OUT */}
            <NavLink title='Register' to='/register' className={linkStyles}>
              Register
            </NavLink>

            <NavLink
              to='/login'
              className={({ isActive }) =>
                `px-5 py-2 rounded-full transition-all ${
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
            {/* Show these when LOGGED IN */}
            <NavLink
              to={role === "admin" ? "/admin-dashboard" : "/user-dashboard"}
              className={linkStyles}
            >
              Dashboard
            </NavLink>

            <div className='flex items-center gap-4 ml-4 pl-4 border-l border-slate-100'>
              <span className='text-slate-400 font-bold tracking-normal italic normal-case'>
                Hi, {userName || "User"}
              </span>
              <button
                onClick={handleLogout}
                className='px-5 py-2 rounded-full bg-rose-50 text-rose-600 font-black hover:bg-rose-600 hover:text-white transition-all border border-rose-100'
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
