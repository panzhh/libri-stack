import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [role, setRole] = useState("user"); // 'user' or 'admin'
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Logging in as ${role}:`, formData);
    // Add your auth logic here
    navigate("/"); // Redirect to Home after login
  };

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-6'>
      <div className='bg-white w-full max-w-md p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-black uppercase italic tracking-tighter'>
            Welcome <span className='text-indigo-600 uppercase'>Back</span>
          </h2>
          <p className='text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2'>
            Access your LibriStack account
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className='flex bg-slate-50 p-1.5 rounded-2xl mb-8'>
          <button
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

        {/* Form */}
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
            className={`w-full py-4 mt-4 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-lg hover:scale-[1.02] active:scale-95 ${
              role === "admin"
                ? "bg-rose-500 shadow-rose-200"
                : "bg-indigo-600 shadow-indigo-200"
            }`}
          >
            Login as {role}
          </button>
        </form>

        {/* Footer */}
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
