import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";

export default function Register() {
  const [role, setRole] = useState("user");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false); // New: Loading state
  const [status, setStatus] = useState({ type: "", msg: "" }); // New: Feedback state

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    adminCode: "",
  });


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
  const hasPassword = formData.password.length >= 6; // Recommended min length
  const hasFullName =
    formData.full_name.length >= 4 && formData.full_name.includes(" "); // Recommended min length
  const hasEmail = formData.email.includes("@");
  const hasAdminCode = role === "admin" ? formData.adminCode.length > 0 : true;

  const canSubmit =
    passwordsMatch &&
    hasPassword &&
    hasEmail &&
    hasFullName &&
    hasAdminCode &&
    agreed &&
    !loading;

  // --- UPDATED SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: role,
          adminCode: role === "admin" ? formData.adminCode : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          msg: "Registration successful! Check your email for the link.",
        });
      } else {
        setStatus({ type: "error", msg: data.msg || "Registration failed" });
      }
    } catch {
      setStatus({
        type: "error",
        msg: "Server is offline. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-[90vh] flex items-center justify-center px-6 py-12'>
      <div className='bg-white w-full max-w-xl p-8 sm:p-12 rounded-xl border-2 border-gb-line shadow-sm'>
        {/* HEADER */}
        <div className='text-center mb-8'>
          <h1 className='gb-h1'>
            Create an account
          </h1>
          <p className='text-black font-bold text-base mt-2'>
            Create your Church in Dunn Loring Library account
          </p>
        </div>

        {/* FEEDBACK UI */}
        {status.msg && (
          <div
            className={`mb-6 p-4 rounded-lg text-base font-bold   text-center animate-in zoom-in-95 duration-200 ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-rose-50 text-rose-700 border border-rose-100"
            }`}
          >
            {status.msg}
          </div>
        )}

        {/* ROLE SELECTOR */}
        <div className='flex bg-gb-box p-1.5 rounded-lg mb-8'>
          <button
            type='button'
            onClick={() => setRole("user")}
            className={`flex-1 py-2 rounded-xl text-base font-bold   transition-all ${role === "user" ? "bg-white shadow-sm text-gb-darker" : "text-black"}`}
          >
            User
          </button>
          <button
            type='button'
            onClick={() => setRole("admin")}
            className={`flex-1 py-2 rounded-xl text-base font-bold   transition-all ${role === "admin" ? "bg-white shadow-sm text-rose-700" : "text-black"}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* FULL NAME */}
          <div>
            <label className='text-base font-bold text-black ml-2 mb-1 block'>
              Full Name (First and Last Name) *
            </label>
            <input
              type='text'
              required
              placeholder='Full Name'
              className='w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none transition-all font-normal text-lg'
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </div>
          {/* EMAIL */}
          <div>
            <label className='text-base font-bold text-black ml-2 mb-1 block'>
              Email Address *
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

          {/* PASSWORD */}
          <div>
            <label className='text-base font-bold text-black ml-2 mb-1 block'>
              Password *
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

          {/* CONFIRM PASSWORD */}
          <div>
            <label className='text-base font-bold text-black ml-2 mb-1 block'>
              Confirm Password *
            </label>
            <input
              type='password'
              required
              placeholder='••••••••'
              className={`w-full px-5 py-4 bg-white border-2 text-black placeholder:text-gb-muted rounded-lg outline-none transition-all font-normal text-lg ${!passwordsMatch && formData.confirmPassword ? "border-rose-400 focus:border-gb-dark" : "border-[#9fb3bd] focus:border-gb-dark"}`}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
          </div>

          {/* PHONE */}
          <div>
            <div className='flex justify-between items-center ml-2 mb-1'>
              <label className='text-base font-bold text-black block'>
                Phone Number
              </label>
              <span className='text-sm font-bold text-black '>
                Optional
              </span>
            </div>
            <input
              type='tel'
              placeholder='(555) 555-5555'
              value={formData.phone}
              onChange={handlePhoneChange}
              className='w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none transition-all font-normal text-lg'
            />
          </div>

          {/* ADMIN CODE */}
          {role === "admin" && (
            <div className='animate-in fade-in slide-in-from-top-2 duration-300'>
              <label className='text-base font-bold text-rose-700 ml-2 mb-1 block'>
                Admin Code *
              </label>
              <input
                type='text'
                required
                placeholder='Enter Secret Code'
                className='w-full px-5 py-4 bg-rose-50 border-2 border-rose-100 focus:border-gb-dark rounded-lg outline-none transition-all font-normal text-lg'
                onChange={(e) =>
                  setFormData({ ...formData, adminCode: e.target.value })
                }
              />
            </div>
          )}

          {/* AGREEMENT */}
          <div className='flex items-start gap-3 px-2 py-2'>
            <input
              type='checkbox'
              id='agree'
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className='mt-1 w-6 h-6 accent-indigo-600 cursor-pointer'
            />
            <label
              htmlFor='agree'
              className='text-base font-bold text-gb-muted leading-tight cursor-pointer select-none'
            >
              I agree to the{" "}
              <span className='text-gb-darker underline'>Terms</span> and{" "}
              <span className='text-gb-darker underline'>Privacy Policy</span>.
            </label>
          </div>

          <button
            type='submit'
            disabled={!canSubmit}
            className={`w-full py-4 mt-2 rounded-lg text-white text-lg font-bold   transition-all shadow-sm ${
              !canSubmit
                ? "bg-white cursor-not-allowed text-black shadow-none"
                : role === "admin"
                  ? "bg-gb-dark "
                  : "bg-gb-dark  hover:scale-[1.02]"
            }`}
          >
            {loading
              ? "Sending..."
              : canSubmit
                ? "Create Account"
                : agreed
                  ? "Fill Fields"
                  : "Check Agreement"}
          </button>
        </form>
      </div>
    </div>
  );
}
