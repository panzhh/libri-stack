import React from "react";

export default function UserDashboard() {
  const userName = localStorage.getItem("userName") || "Member";
  const userEmail = localStorage.getItem("userEmail") || "Verified User";

  return (
    <div className='flex min-h-[calc(100vh-116px)]'>
      {" "}
      {/* Adjusts height based on Navbar */}
      {/* --- USER SIDEBAR --- */}
      <aside className='w-64 bg-white border-r border-slate-100 p-8 flex flex-col hidden lg:flex'>
        <div className='mb-10'>
          <p className='text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4'>
            Library Menu
          </p>
          <nav className='space-y-2'>
            <button className='w-full text-left p-3 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all'>
              🏠 Overview
            </button>
            <button className='w-full text-left p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all'>
              📖 My Books
            </button>
            <button className='w-full text-left p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all'>
              🔍 Browse Catalog
            </button>
            <button className='w-full text-left p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all'>
              ⭐ Wishlist
            </button>
          </nav>
        </div>

        <div className='mt-auto p-6 bg-slate-50 rounded-[2rem] border border-slate-100'>
          <p className='text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center'>
            Need Help?
          </p>
          <button className='w-full py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-tighter hover:bg-indigo-600 hover:text-white transition-all'>
            Contact Support
          </button>
        </div>
      </aside>
      {/* --- MAIN CONTENT AREA --- */}
      <main className='flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-50'>
        {/* Welcome Hero */}
        <div className='max-w-5xl bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-100 mb-10 relative overflow-hidden'>
          <div className='relative z-10'>
            <h2 className='text-4xl font-black mb-2 tracking-tighter'>
              Welcome back, {userName}!
            </h2>
            <p className='text-indigo-100 font-bold opacity-80 uppercase text-[10px] tracking-widest'>
              {userEmail}
            </p>
          </div>
          <div className='absolute -right-10 -top-10 w-48 h-48 bg-indigo-500 rounded-full opacity-30'></div>
        </div>

        {/* Stats Grid */}
        <div className='max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
          <div className='bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm'>
            <div className='w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl mb-4'>
              📚
            </div>
            <h3 className='font-black uppercase tracking-widest text-[9px] text-slate-400'>
              Personal Collection
            </h3>
            <p className='text-2xl font-black text-slate-800'>12</p>
          </div>

          <div className='bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm'>
            <div className='w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl mb-4'>
              ⏳
            </div>
            <h3 className='font-black uppercase tracking-widest text-[9px] text-slate-400'>
              Active Borrows
            </h3>
            <p className='text-2xl font-black text-slate-800'>03</p>
          </div>

          <div className='bg-white p-6 rounded-[2rem] border-2 border-indigo-500 border-dashed hover:bg-indigo-50 cursor-pointer transition-all group'>
            <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg mb-4 group-hover:scale-110 transition-transform'>
              ＋
            </div>
            <h3 className='font-black uppercase tracking-widest text-[9px] text-indigo-600'>
              Quick Action
            </h3>
            <p className='text-sm font-bold text-slate-800'>Add New Book</p>
          </div>
        </div>

        {/* Placeholder for Recent Books */}
        <section className='max-w-5xl bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm'>
          <h3 className='text-sm font-black text-slate-800 uppercase italic mb-6'>
            Recently Added
          </h3>
          <div className='flex items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl'>
            <p className='text-slate-300 font-bold text-xs uppercase tracking-widest'>
              Your library is empty
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
