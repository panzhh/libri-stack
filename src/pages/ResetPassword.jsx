import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message: "Password reset successful! Redirecting to login...",
        });
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setStatus({
          type: "error",
          message: data.error || "Link expired or invalid.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "Server error. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4'>
      <div className='max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100'>
        <h2 className='text-2xl font-bold text-slate-900 text-center mb-2'>
          New Password
        </h2>
        <p className='text-slate-500 text-center text-sm mb-8'>
          Please enter your new secure password.
        </p>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <input
            type='password'
            placeholder='New Password'
            required
            className='w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type='password'
            placeholder='Confirm New Password'
            required
            className='w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {status.message && (
            <p
              className={`text-center text-xs font-bold uppercase ${status.type === "error" ? "text-rose-500" : "text-emerald-600"}`}
            >
              {status.message}
            </p>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50'
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
