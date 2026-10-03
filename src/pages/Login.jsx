import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";

export default function Login() {
  const [role, setRole] = useState("user");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false); // New: prevents double clicks
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // We combine the input data with the current tab role
      const payload = { ...formData, role: role };

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userName", data.full_name);
        localStorage.setItem("userEmail", data.email); // Fixed the 'undefined' issue
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: data.full_name,
            email: data.email,
            role: data.role,
            id: data.id,
            token: data.token, // <--- ADD THIS LINE
          }),
        );

        // Success redirect
        if (data.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/user-dashboard");
        }
      } else {
        setMessage({ type: "error", text: data.msg || "Invalid credentials" });
      }
    } catch {
      setMessage({ type: "error", text: "Server connection failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-6'>
      <div className='bg-white w-full max-w-xl p-8 sm:p-12 rounded-xl border-2 border-gb-line shadow-sm'>
        <div className='text-center mb-8'>
          <h1 className='gb-h1'>
            Log in
          </h1>
          <p className='text-black font-bold text-base mt-2'>
            {role === "admin" ? "Admin login" : "Member login"}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className='flex bg-gb-box p-1.5 rounded-lg mb-8'>
          <button
            type='button' // Important: prevents form submission
            onClick={() => setRole("user")}
            className={`flex-1 py-2 rounded-xl text-base font-bold   transition-all ${
              role === "user"
                ? "bg-white shadow-sm text-gb-darker"
                : "text-black"
            }`}
          >
            User
          </button>
          <button
            type='button' // Important: prevents form submission
            onClick={() => setRole("admin")}
            className={`flex-1 py-2 rounded-xl text-base font-bold   transition-all ${
              role === "admin"
                ? "bg-white shadow-sm text-rose-700"
                : "text-black"
            }`}
          >
            Admin
          </button>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-lg mb-6 text-base font-bold   ${
              message.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='text-base font-bold text-black ml-2 mb-1 block'>
              Email Address
            </label>
            <input
              type='email'
              required
              placeholder='name@example.com'
              className='w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none transition-all font-normal text-lg'
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className='text-base font-bold text-black ml-2 mb-1 block'>
              Password
            </label>
            <input
              type='password'
              required
              placeholder='••••••••'
              className='w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none transition-all font-normal text-lg'
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <div className='flex justify-end'>
            <Link
              to='/forgot-password'
              className='text-base font-bold text-gb-darker hover:underline'
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type='submit'
            disabled={loading}
            className={`w-full py-4 mt-4 rounded-lg text-white text-lg font-bold   transition-all shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 ${
              role === "admin"
                ? "bg-gb-dark "
                : "bg-gb-dark "
            }`}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className='text-center mt-8 text-base font-bold text-black '>
          Don't have an account?{" "}
          <Link to='/register' className='text-gb-darker hover:underline'>
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
}
