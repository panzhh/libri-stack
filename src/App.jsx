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
import Footer from "./components/Footer"; // Import your new footer
import UserDashboard from "./pages/UserDashBoard";
import BorrowedBooks from "./pages/BorrowedBooks";
import BorrowHistory from "./pages/BorrowHistory";
import MyOrders from "./pages/MyOrders";
import AdminDashboard from "./pages/AdminDashboard";
import OrderBooks from "./pages/OrderBooks";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import backgroundImage from "./assets/background.jpg";

export default function App() {
  return (
    <Router>
      {/* The background photo sits behind the navbar too, so there is no white strip */}
      <div
        className="min-h-screen pt-6 bg-slate-900 bg-cover bg-center bg-fixed"
        style={{
          // Dark tint keeps white text that sits directly on the photo readable
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.35), rgba(15, 23, 42, 0.35)), url(${backgroundImage})`,
        }}
      >
        {/* The Navbar stays outside Routes so it shows on every page */}
        <Navbar />

        <main className="min-h-screen">
          <Routes>
            {/* Main Library Page */}
            <Route path="/" element={<Home />} />

            {/* Auth Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Info Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/order-books" element={<OrderBooks />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/user-dashboard" element={<UserDashboard />}>
              {/* When the user goes to /user-dashboard, it fills the <Outlet /> with BorrowedBooks */}
              <Route index element={<BorrowedBooks />} />
              <Route path="history" element={<BorrowHistory />} />
              <Route path="orders" element={<MyOrders />} />{" "}
              {/* Add this line */}
              {/* You can add more routes here later, e.g., <Route path="history" element={<History />} /> */}
            </Route>

            {/* 404 Fallback - Optional */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center pt-20">
                  <h1 className="text-6xl font-black italic text-slate-200">
                    404
                  </h1>
                  <p className="font-bold uppercase tracking-widest text-white">
                    Page Not Found
                  </p>
                </div>
              }
            />
          </Routes>
          <Footer />
        </main>
      </div>
    </Router>
  );
}
