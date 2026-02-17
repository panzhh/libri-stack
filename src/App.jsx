import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Components
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import VerifyEmail from "./components/VerifyEmail";
import UserDashboard from "./pages/UserDashBoard";
import BorrowedBooks from "./pages/BorrowedBooks";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      {/* The Navbar stays outside Routes so it shows on every page */}
      <Navbar />

      <main className='min-h-screen bg-slate-50'>
        <Routes>
          {/* Main Library Page */}
          <Route path='/' element={<Home />} />

          {/* Auth Pages */}
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

          {/* Info Pages */}
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/verify/:token' element={<VerifyEmail />} />
          <Route path='/admin-dashboard' element={<AdminDashboard />} />
          <Route path='/user-dashboard' element={<UserDashboard />}>
            {/* When the user goes to /user-dashboard, it fills the <Outlet /> with BorrowedBooks */}
            <Route index element={<BorrowedBooks />} />
            {/* You can add more routes here later, e.g., <Route path="history" element={<History />} /> */}
          </Route>

          {/* 404 Fallback - Optional */}
          <Route
            path='*'
            element={
              <div className='flex flex-col items-center justify-center pt-20'>
                <h1 className='text-6xl font-black italic text-slate-200'>
                  404
                </h1>
                <p className='font-bold uppercase tracking-widest text-slate-400'>
                  Page Not Found
                </p>
              </div>
            }
          />
        </Routes>
      </main>

      {/* You could also add a <Footer /> here later */}
    </Router>
  );
}
