import React from "react";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const navigate = useNavigate();

  // Get user info from storage
  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "No email found";

  const handleLogout = () => {
    localStorage.clear(); // Wipe token and user info
    navigate("/login");
  };

  return (
    <div className='min-h-screen bg-slate-50 p-8'>
      {/* Header / Navbar Area */}
      <div className='max-w-6xl mx-auto flex justify-between items-center mb-12'>
        <div>
          <h1 className='text-3xl font-black tracking-tighter uppercase italic'>
            Libri<span className='text-indigo-600'>Stack</span>
          </h1>
          <p className='text-slate-400 font-bold text-[10px] uppercase tracking-widest'>
            Member Dashboard
          </p>
        </div>

        <button
          onClick={handleLogout}
          className='px-6 py-2 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:border-red-200 hover:text-red-500 transition-all'
        >
          Logout
        </button>
      </div>

      {/* Hero Welcome Section */}
      <div className='max-w-6xl mx-auto bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 mb-8 relative overflow-hidden'>
        <div className='relative z-10'>
          <h2 className='text-4xl font-black mb-2'>
            Welcome back, {userName}!
          </h2>
          <p className='text-indigo-100 font-medium'>{userEmail}</p>
        </div>
        {/* Decorative circle */}
        <div className='absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500 rounded-full opacity-50'></div>
      </div>

      {/* Main Content Grid */}
      <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Stat Card 1 */}
        <div className='bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm'>
          <span className='text-indigo-600 text-3xl mb-4 block'>📚</span>
          <h3 className='font-black uppercase tracking-widest text-xs text-slate-400 mb-1'>
            My Collection
          </h3>
          <p className='text-2xl font-black text-slate-800'>12 Items</p>
        </div>

        {/* Stat Card 2 */}
        <div className='bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm'>
          <span className='text-emerald-500 text-3xl mb-4 block'>⏳</span>
          <h3 className='font-black uppercase tracking-widest text-xs text-slate-400 mb-1'>
            Borrowed
          </h3>
          <p className='text-2xl font-black text-slate-800'>3 Items</p>
        </div>

        {/* Action Card */}
        <div className='bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-sm hover:border-indigo-400 transition-colors cursor-pointer group'>
          <span className='text-indigo-600 text-3xl mb-4 block group-hover:scale-110 transition-transform'>
            ➕
          </span>
          <h3 className='font-black uppercase tracking-widest text-xs text-indigo-600 mb-1'>
            New Entry
          </h3>
          <p className='text-sm text-slate-500'>
            Add a new book to the library system.
          </p>
        </div>
      </div>
    </div>
  );
}
