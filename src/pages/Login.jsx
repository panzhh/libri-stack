import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("data1: ", data);
      console.log("response: ", response.ok);

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userName", data.full_name);
        localStorage.setItem("userEmail", data.email); // Fixed the 'undefined' issue

        // Success redirect
        if (data.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/user-dashboard");
        }
      } else {
        setMessage({ type: "error", text: data.msg || "Invalid credentials" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server connection failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-6'>
      <div className='bg-white w-full max-w-md p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl'>
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-black uppercase italic tracking-tighter'>
            Libri<span className='text-indigo-600'>Stack</span>
          </h2>
          <p className='text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2'>
            Secure {role} Access
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className='flex bg-slate-50 p-1.5 rounded-2xl mb-8'>
          <button
            type='button' // Important: prevents form submission
            onClick={() => setRole("user")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              role === "user"
                ? "bg-white shadow-sm text-indigo-600"
                : "text-slate-400"
            }`}
          >
            User
          </button>
          <button
            type='button' // Important: prevents form submission
            onClick={() => setRole("admin")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              role === "admin"
                ? "bg-white shadow-sm text-rose-500"
                : "text-slate-400"
            }`}
          >
            Admin
          </button>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-2xl mb-6 text-xs font-bold uppercase tracking-widest ${
              message.type === "error"
                ? "bg-red-50 text-red-500"
                : "bg-green-50 text-green-500"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block'>
              Email Address
            </label>
            <input
              type='email'
              required
              placeholder='name@example.com'
              className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold'
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className='text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block'>
              Password
            </label>
            <input
              type='password'
              required
              placeholder='••••••••'
              className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold'
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className={`w-full py-4 mt-4 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 ${
              role === "admin"
                ? "bg-rose-500 shadow-rose-200"
                : "bg-indigo-600 shadow-indigo-200"
            }`}
          >
            {loading ? "Authenticating..." : `Login as ${role}`}
          </button>
        </form>

        <p className='text-center mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
          Don't have an account?{" "}
          <Link to='/register' className='text-indigo-600 hover:underline'>
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
}
