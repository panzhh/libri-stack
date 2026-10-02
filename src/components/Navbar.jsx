import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

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
    `transition-all hover:text-indigo-600 text-sm tracking-wide ${
      isActive ? "text-indigo-600 font-black" : "text-slate-700 font-bold"
    }`;

  return (
    <nav className='w-[calc(100%-2rem)] max-w-7xl mx-auto p-6 lg:p-8 flex flex-wrap justify-between items-center bg-slate-200 mb-4 rounded-[2rem] shadow-sm border-2 border-slate-400'>
      {/* Branding - Shrinks slightly on tiny screens */}
      <Link
        to='/'
        className='text-lg sm:text-2xl font-black italic tracking-tighter uppercase whitespace-nowrap'
      >
        Church in Dunn Loring <span className='text-indigo-600'>Library</span>
      </Link>

      {/* Navigation Links - Automatically wraps if space runs out */}
      <div className='flex flex-wrap items-center gap-4 lg:gap-8 text-sm uppercase tracking-wider'>
        <NavLink title='Home' to='/' className={linkStyles}>
          Home
        </NavLink>
        <NavLink title='About' to='/about' className={linkStyles}>
          About
        </NavLink>

        <NavLink title='Contact' to='/contact' className={linkStyles}>
          Contact
        </NavLink>

        {!token ? (
          <div className='flex items-center gap-3'>
            <NavLink title='Register' to='/register' className={linkStyles}>
              Register
            </NavLink>
            <NavLink
              to='/login'
              className={({ isActive }) =>
                `px-5 py-2 rounded-full font-black transition-all text-sm ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 text-white hover:bg-indigo-600"
                }`
              }
            >
              Login
            </NavLink>
          </div>
        ) : (
          <div className='flex flex-wrap items-center gap-4 lg:gap-6'>
            {role === "admin" && (
              <NavLink to='/admin-dashboard' className={linkStyles}>
                Admin Panel
              </NavLink>
            )}

            <NavLink to='/user-dashboard' className={linkStyles}>
              {role === "admin" ? "My Borrows" : "Dashboard"}
            </NavLink>

            <div className='flex items-center gap-4 lg:gap-6 lg:ml-4 lg:pl-6 border-l-2 border-slate-100'>
              <span className='hidden sm:inline text-slate-700 font-bold tracking-tight italic normal-case text-base'>
                Hi, {userName?.split(" ")[0] || "User"}
              </span>
              <button
                onClick={handleLogout}
                className='px-5 py-2 rounded-full bg-rose-50 text-rose-700 font-black text-sm hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm'
              >
                Logout
              </button>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
