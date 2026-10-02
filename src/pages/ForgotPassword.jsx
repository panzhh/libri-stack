import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {

      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessage(
        "If an account exists with this email, a reset link has been sent.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-300 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8 bg-slate-200 p-10 rounded-xl shadow-lg border border-slate-400'>
        <div>
          <h2 className='text-center text-3xl font-extrabold text-slate-900'>
            Reset Password
          </h2>
          <p className='mt-2 text-center text-sm text-slate-700'>
            Enter your email and we'll send you a recovery link.
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <input
              type='email'
              required
              className='appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              placeholder='Email address'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <p className='text-emerald-700 text-xs font-bold uppercase text-center'>
              {message}
            </p>
          )}
          {error && (
            <p className='text-rose-700 text-xs font-bold uppercase text-center'>
              {error}
            </p>
          )}

          <div>
            <button
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50'
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>

          <div className='text-center'>
            <Link
              to='/login'
              className='text-xs font-bold text-slate-800 hover:text-indigo-600 uppercase tracking-widest transition-colors'
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
