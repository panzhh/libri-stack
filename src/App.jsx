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

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col">
        {/* The Navbar stays outside Routes so it shows on every page */}
        <Navbar />

        <main className="flex-1">
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
                <div className="max-w-7xl mx-auto px-6 py-20">
                  <h1 className="gb-h1">Page not found</h1>
                  <p className="text-lg mt-4">
                    Sorry, this page does not exist.{" "}
                    <a href="/" className="gb-link">
                      Back to the library
                    </a>
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
