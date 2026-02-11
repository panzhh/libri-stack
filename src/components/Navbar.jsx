import React from "react";
import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  // Helper function to keep the code clean
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
      </div>
    </nav>
  );
}
