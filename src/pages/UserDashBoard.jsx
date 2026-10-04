import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { API_URL, authHeaders } from "../api";
import useUnreadMessages from "../hooks/useUnreadMessages";

export default function UserDashboard() {
  const userName = localStorage.getItem("userName") || "Member";
  const userEmail = localStorage.getItem("userEmail") || "Verified User";
  const location = useLocation();
  const unreadMessages = useUnreadMessages();

  const [stats, setStats] = useState({ active: 0, total: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* --- MOBILE MENU BUTTON --- */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        className='lg:hidden fixed bottom-6 right-6 z-[60] w-16 h-16 bg-gb-dark text-white rounded-full shadow-sm flex items-center justify-center text-3xl'
      >
        {mobileMenuOpen ? "✕" : "☰"}
      </button>
      {mobileMenuOpen && (
        <div
          className='fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden'
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* --- USER SIDEBAR (slides in on mobile) --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gb-line p-8 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:w-64`}
      >
        <div className='mb-10'>
          <p className='text-black font-bold text-xs mb-4'>
            Library Menu
          </p>
          <nav className='space-y-2' onClick={() => setMobileMenuOpen(false)}>
            <Link
              to='/user-dashboard'
              className={`block w-full p-3 rounded-xl font-bold text-xs   transition-all ${
                isActive("/user-dashboard")
                  ? "bg-gb-box text-gb-darker"
                  : "text-black hover:bg-gb-tile"
              }`}
            >
              🏠 My Borrows
            </Link>

            {/* --- ADDED: BORROW HISTORY LINK --- */}
            <Link
              to='/user-dashboard/history'
              className={`block w-full p-3 rounded-xl font-bold text-xs   transition-all ${
                isActive("/user-dashboard/history")
                  ? "bg-gb-box text-gb-darker"
                  : "text-black hover:bg-gb-tile"
              }`}
            >
              📜 Borrow History
            </Link>
            <Link
              to='/user-dashboard/orders'
              className={`block w-full p-3 rounded-xl font-bold text-xs   transition-all ${
                isActive("/user-dashboard/orders")
                  ? "bg-gb-box text-gb-darker"
                  : "text-black hover:bg-gb-tile"
              }`}
            >
              🧾 My Orders
            </Link>
            <Link
              to='/user-dashboard/messages'
              className={`flex items-center justify-between w-full p-3 rounded-xl font-bold text-xs transition-all ${
                isActive("/user-dashboard/messages")
                  ? "bg-gb-box text-gb-darker"
                  : "text-black hover:bg-gb-tile"
              }`}
            >
              ✉️ Messages
              {unreadMessages > 0 && (
                <span
                  className='min-w-6 px-1.5 rounded-full bg-gb-red text-white text-sm text-center'
                  aria-label={`${unreadMessages} unread`}
                >
                  {unreadMessages}
                </span>
              )}
            </Link>

            <Link
              to='/'
              className='block w-full p-3 rounded-xl text-black hover:bg-gb-tile hover:text-gb-muted font-bold text-xs transition-all'
            >
              📖 Browse Book
            </Link>
          </nav>
        </div>

        <div className='mt-auto p-6 bg-gb-box rounded-xl border border-gb-line'>
          <p className='text-xs font-bold text-black mb-2 text-center'>
            Need Help?
          </p>
          <button className='w-full py-2 bg-white border border-gb-line rounded-lg text-xs font-bold hover:bg-gb-dark hover:text-white transition-all'>
            Contact Support
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className='flex-1 p-6 lg:p-12 overflow-y-auto bg-gb-box w-full'>
        {/* Welcome Hero */}
        <div className='max-w-5xl bg-gb-dark rounded-xl lg:rounded-xl p-8 lg:p-10 text-white shadow-sm mb-10 relative overflow-hidden'>
          <div className='relative z-10'>
            <h2 className='text-3xl lg:text-4xl font-bold mb-2 text-white'>
              Welcome back, {userName}!
            </h2>
            <p className='text-indigo-100 font-bold text-xs '>
              {userEmail}
            </p>
          </div>
          <div className='absolute -right-10 -top-10 w-32 h-32 lg:w-48 lg:h-48 bg-gb-dark rounded-full opacity-30'></div>
        </div>

        {/* Stats Grid */}
        <div className='max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
          <div className='bg-white p-6 rounded-xl border border-gb-line shadow-sm'>
            <div className='w-10 h-10 bg-gb-box rounded-xl flex items-center justify-center text-xl mb-4'>
              📚
            </div>
            <h3 className='font-bold text-xs text-black'>
              History Borrows
            </h3>
            {/* REAL STAT: Replaced fixed 12 */}
            <p className='text-2xl font-bold text-black'>
              {stats.total.toString().padStart(2, "0")}
            </p>
          </div>

          <div className='bg-white p-6 rounded-xl border border-gb-line shadow-sm'>
            <div className='w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl mb-4'>
              ⏳
            </div>
            <h3 className='font-bold text-xs text-black'>
              Active Borrows
            </h3>
            {/* REAL STAT: Replaced fixed 03 */}
            <p className='text-2xl font-bold text-black'>
              {stats.active.toString().padStart(2, "0")}
            </p>
          </div>

          <Link
            to='/'
            className='bg-white p-6 rounded-xl border-2 border-gb-dark border-dashed hover:bg-gb-box cursor-pointer transition-all group'
          >
            <div className='w-10 h-10 bg-gb-dark rounded-xl flex items-center justify-center text-white text-lg mb-4 group-hover:scale-110 transition-transform'>
              ＋
            </div>
            <h3 className='font-bold text-xs text-gb-darker'>
              Quick Action
            </h3>
            <p className='text-sm font-bold text-black'>Borrow More</p>
          </Link>
        </div>

        {/* --- DYNAMIC CONTENT AREA --- */}
        <section className='max-w-5xl bg-white rounded-xl lg:rounded-xl p-6 lg:p-8 border border-gb-line shadow-sm'>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
