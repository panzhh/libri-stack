import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("userName") || "Admin";

  // State for system stats (you can fetch these from Flask later)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBooks: 0,
    pendingVerifications: 0,
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      {/* Sidebar */}
      <aside className='w-72 bg-slate-900 text-white p-8 flex flex-col sticky top-0 h-screen overflow-y-auto'>
        <div className='mb-12'>
          <h1 className='text-2xl font-black italic tracking-tighter'>
            LIBRI<span className='text-rose-500'>STACK</span>
          </h1>
          <p className='text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]'>
            Control Panel
          </p>
        </div>

        <nav className='flex-1 space-y-6'>
          <div>
            <p className='text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4'>
              Main Menu
            </p>
            <ul className='space-y-2'>
              <li className='p-3 bg-rose-500/10 text-rose-500 rounded-xl font-bold text-sm cursor-pointer border border-rose-500/20'>
                Dashboard Overview
              </li>
              <li className='p-3 text-slate-400 hover:text-white transition-colors font-bold text-sm cursor-pointer'>
                User Management
              </li>
              <li className='p-3 text-slate-400 hover:text-white transition-colors font-bold text-sm cursor-pointer'>
                Book Inventory
              </li>
            </ul>
          </div>

          <div>
            <p className='text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4'>
              Security
            </p>
            <ul className='space-y-2'>
              <li className='p-3 text-slate-400 hover:text-white transition-colors font-bold text-sm cursor-pointer'>
                Invite Codes
              </li>
              <li className='p-3 text-slate-400 hover:text-white transition-colors font-bold text-sm cursor-pointer'>
                System Logs
              </li>
            </ul>
          </div>
        </nav>

        <button
          onClick={handleLogout}
          className='mt-auto p-4 bg-slate-800 hover:bg-rose-600 transition-all rounded-2xl text-sm font-black uppercase tracking-widest'
        >
          Logout Session
        </button>
      </aside>

      {/* Main Content Area */}
      <main className='flex-1 p-12 overflow-y-auto'>
        <header className='flex justify-between items-center mb-12'>
          <div>
            <h2 className='text-3xl font-black text-slate-800'>
              System Dashboard
            </h2>
            <p className='text-slate-400 font-medium'>
              Welcome back, {adminName}. Here's your library at a glance.
            </p>
          </div>
          <div className='flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-200 shadow-sm'>
            <div className='w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-xl'>
              {adminName.charAt(0)}
            </div>
            <div>
              <p className='text-xs font-black text-slate-800 uppercase'>
                {adminName}
              </p>
              <p className='text-[10px] font-bold text-rose-500 uppercase tracking-tighter text-left'>
                System Administrator
              </p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
          <div className='bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all'>
            <div className='w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mb-6'>
              👥
            </div>
            <h3 className='text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1'>
              Total Members
            </h3>
            <p className='text-4xl font-black text-slate-800 tracking-tighter'>
              1,204
            </p>
          </div>

          <div className='bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all'>
            <div className='w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl mb-6'>
              📖
            </div>
            <h3 className='text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1'>
              Books in Catalog
            </h3>
            <p className='text-4xl font-black text-slate-800 tracking-tighter'>
              5,492
            </p>
          </div>

          <div className='bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all'>
            <div className='w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl mb-6'>
              ⚠️
            </div>
            <h3 className='text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1'>
              Pending Actions
            </h3>
            <p className='text-4xl font-black text-amber-500 tracking-tighter'>
              07
            </p>
          </div>
        </div>

        {/* Recent Activity Table Placeholder */}
        <section className='bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10'>
          <div className='flex justify-between items-center mb-8'>
            <h3 className='text-xl font-black text-slate-800 uppercase italic tracking-tighter'>
              Recent System Activity
            </h3>
            <button className='text-[10px] font-black uppercase text-indigo-600 hover:underline tracking-widest'>
              View Full Logs
            </button>
          </div>

          <div className='space-y-4'>
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className='flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-2 h-2 bg-emerald-500 rounded-full'></div>
                  <p className='text-sm font-bold text-slate-700 uppercase tracking-tight'>
                    New user registration:{" "}
                    <span className='text-slate-400 font-medium lowercase'>
                      user_{item}@example.com
                    </span>
                  </p>
                </div>
                <p className='text-[10px] font-black text-slate-400 uppercase'>
                  Just Now
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
