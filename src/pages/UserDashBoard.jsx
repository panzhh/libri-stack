import React, { useState, useEffect } from "react"; // Added useState and useEffect
import { Outlet, Link, useLocation } from "react-router-dom";
import { API_URL, authHeaders } from "../api";

export default function UserDashboard() {
  const userName = localStorage.getItem("userName") || "Member";
  const userEmail = localStorage.getItem("userEmail") || "Verified User";
  const location = useLocation();

  // --- NEW: Stats State ---
  const [stats, setStats] = useState({ active: 0, total: 0 });

  // --- NEW: Fetch Stats from Backend ---
  useEffect(() => {
    const fetchStats = async () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData?.token) return;

      try {
        const response = await fetch(`${API_URL}/api/user/stats`, {
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          setStats({
            active: data.active || 0,
            total: data.total || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };

    fetchStats();
  }, [location.pathname]); // Refreshes stats when you navigate between Overview and History

  // Helper to highlight the active link
  const isActive = (path) => location.pathname === path;

  return (
    <div className='flex min-h-[calc(100vh-116px)]'>
      {/* --- USER SIDEBAR --- */}
      <aside className='w-64 bg-slate-200 border-r border-slate-400 p-8 flex flex-col hidden lg:flex'>
        <div className='mb-10'>
          <p className='text-slate-800 font-black text-xs uppercase tracking-[0.2em] mb-4'>
            Library Menu
          </p>
          <nav className='space-y-2'>
            <Link
              to='/user-dashboard'
              className={`block w-full p-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                isActive("/user-dashboard")
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              🏠 My Borrows
            </Link>

            {/* --- ADDED: BORROW HISTORY LINK --- */}
            <Link
              to='/user-dashboard/history'
              className={`block w-full p-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                isActive("/user-dashboard/history")
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              📜 Borrow History
            </Link>
            {/* ---------------------------------- */}

            <Link
              to='/'
              className='block w-full p-3 rounded-xl text-slate-800 hover:bg-slate-50 hover:text-slate-700 font-bold text-xs uppercase tracking-widest transition-all'
            >
              📖 Browse Book
            </Link>
          </nav>
        </div>

        <div className='mt-auto p-6 bg-slate-300 rounded-[2rem] border border-slate-400'>
          <p className='text-xs font-black text-slate-800 uppercase tracking-widest mb-2 text-center'>
            Need Help?
          </p>
          <button className='w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-black uppercase tracking-tighter hover:bg-indigo-600 hover:text-white transition-all'>
            Contact Support
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className='flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-300'>
        {/* Welcome Hero */}
        <div className='max-w-5xl bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-100 mb-10 relative overflow-hidden'>
          <div className='relative z-10'>
            <h2 className='text-4xl font-black mb-2 tracking-tighter text-white'>
              Welcome back, {userName}!
            </h2>
            <p className='text-indigo-100 font-bold uppercase text-xs tracking-widest'>
              {userEmail}
            </p>
          </div>
          <div className='absolute -right-10 -top-10 w-48 h-48 bg-indigo-500 rounded-full opacity-30'></div>
        </div>

        {/* Stats Grid */}
        <div className='max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
          <div className='bg-slate-200 p-6 rounded-[2rem] border border-slate-400 shadow-sm'>
            <div className='w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl mb-4'>
              📚
            </div>
            <h3 className='font-black uppercase tracking-widest text-xs text-slate-800'>
              History Borrows
            </h3>
            {/* REAL STAT: Replaced fixed 12 */}
            <p className='text-2xl font-black text-slate-800'>
              {stats.total.toString().padStart(2, "0")}
            </p>
          </div>

          <div className='bg-slate-200 p-6 rounded-[2rem] border border-slate-400 shadow-sm'>
            <div className='w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl mb-4'>
              ⏳
            </div>
            <h3 className='font-black uppercase tracking-widest text-xs text-slate-800'>
              Active Borrows
            </h3>
            {/* REAL STAT: Replaced fixed 03 */}
            <p className='text-2xl font-black text-slate-800'>
              {stats.active.toString().padStart(2, "0")}
            </p>
          </div>

          <Link
            to='/'
            className='bg-white p-6 rounded-[2rem] border-2 border-indigo-500 border-dashed hover:bg-indigo-50 cursor-pointer transition-all group'
          >
            <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg mb-4 group-hover:scale-110 transition-transform'>
              ＋
            </div>
            <h3 className='font-black uppercase tracking-widest text-xs text-indigo-600'>
              Quick Action
            </h3>
            <p className='text-sm font-bold text-slate-800'>Borrow More</p>
          </Link>
        </div>

        {/* --- DYNAMIC CONTENT AREA --- */}
        <section className='max-w-5xl bg-slate-200 rounded-[2.5rem] p-8 border border-slate-400 shadow-sm'>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
