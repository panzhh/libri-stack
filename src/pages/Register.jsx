import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [role, setRole] = useState("user");
  const [agreed, setAgreed] = useState(false); // Agreement state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    adminCode: "",
  });

  const navigate = useNavigate();

  // --- PHONE FORMATTING LOGIC ---
  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/\D/g, "");
    let formatted = input;
    if (input.length > 0) {
      if (input.length <= 3) formatted = `(${input}`;
      else if (input.length <= 6)
        formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
      else
        formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6, 10)}`;
    }
    setFormData({ ...formData, phone: formatted });
  };

  // --- VALIDATION LOGIC ---
  const passwordsMatch = formData.password === formData.confirmPassword;
  const hasPassword = formData.password.length > 0;
  const hasEmail = formData.email.includes("@");
  const hasAdminCode = role === "admin" ? formData.adminCode.length > 0 : true;

  // Added "agreed" to the required submission conditions
  const canSubmit =
    passwordsMatch && hasPassword && hasEmail && hasAdminCode && agreed;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Registering ${role}:`, formData);
    navigate("/login");
  };

  return (
    <div className='min-h-[90vh] flex items-center justify-center px-6 py-12'>
      <div className='bg-white w-full max-w-md p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl'>
        {/* HEADER */}
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-black uppercase italic tracking-tighter'>
            Join the <span className='text-indigo-600'>Stack</span>
          </h2>
          <p className='text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2'>
            Create your LibriStack account
          </p>
        </div>

        {/* ROLE SELECTOR */}
        <div className='flex bg-slate-50 p-1.5 rounded-2xl mb-8'>
          <button
            type='button'
            onClick={() => setRole("user")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === "user" ? "bg-white shadow-sm text-indigo-600" : "text-slate-400"}`}
          >
            User
          </button>
          <button
            type='button'
            onClick={() => setRole("admin")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === "admin" ? "bg-white shadow-sm text-rose-500" : "text-slate-400"}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* EMAIL */}
          <div>
            <label className='text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block'>
              Email Address *
            </label>
            <input
              type='email'
              required
              placeholder='name@example.com'
              className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm'
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className='text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block'>
              Password *
            </label>
            <input
              type='password'
              required
              placeholder='••••••••'
              className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm'
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className='text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block'>
              Confirm Password *
            </label>
            <input
              type='password'
              required
              placeholder='••••••••'
              className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold text-sm ${!passwordsMatch && formData.confirmPassword ? "border-rose-400 focus:border-rose-500" : "border-transparent focus:border-indigo-600 focus:bg-white"}`}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
          </div>

          {/* PHONE (Optional) */}
          <div>
            <div className='flex justify-between items-center ml-2 mb-1'>
              <label className='text-[10px] font-black uppercase tracking-widest text-slate-400 block'>
                Phone Number
              </label>
              <span className='text-[8px] font-bold text-slate-300 uppercase tracking-tighter italic'>
                Optional
              </span>
            </div>
            <input
              type='tel'
              placeholder='(555) 555-5555'
              value={formData.phone}
              onChange={handlePhoneChange}
              className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm'
            />
          </div>

          {/* ADMIN CODE */}
          {role === "admin" && (
            <div className='animate-in fade-in slide-in-from-top-2 duration-300'>
              <label className='text-[10px] font-black uppercase tracking-widest text-rose-500 ml-2 mb-1 block'>
                Admin Code *
              </label>
              <input
                type='text'
                required
                placeholder='Enter Secret Code'
                className='w-full px-5 py-4 bg-rose-50 border-2 border-rose-100 focus:border-rose-500 rounded-2xl outline-none transition-all font-bold text-sm'
                onChange={(e) =>
                  setFormData({ ...formData, adminCode: e.target.value })
                }
              />
            </div>
          )}

          {/* AGREEMENT CHECKBOX */}
          <div className='flex items-start gap-3 px-2 py-2'>
            <input
              type='checkbox'
              id='agree'
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className='mt-1 w-5 h-5 accent-indigo-600 cursor-pointer'
            />
            <label
              htmlFor='agree'
              className='text-[10px] font-bold text-slate-500 leading-tight cursor-pointer select-none'
            >
              I agree to the{" "}
              <span className='text-indigo-600 underline'>
                Terms of Service
              </span>{" "}
              and{" "}
              <span className='text-indigo-600 underline'>Privacy Policy</span>.
            </label>
          </div>

          <button
            type='submit'
            disabled={!canSubmit}
            className={`w-full py-4 mt-2 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-lg ${
              !canSubmit
                ? "bg-slate-200 cursor-not-allowed text-slate-400 shadow-none"
                : role === "admin"
                  ? "bg-rose-500 shadow-rose-200"
                  : "bg-indigo-600 shadow-indigo-200 hover:scale-[1.02]"
            }`}
          >
            {canSubmit
              ? "Create Account"
              : agreed
                ? "Fill Required Fields"
                : "Check Agreement"}
          </button>
        </form>
      </div>
    </div>
  );
}
