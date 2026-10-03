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

      const data = await response.json().catch(() => ({})); // error pages aren't JSON

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
    <div className='flex justify-center px-4 py-12 sm:py-16'>
      <div className='max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-gb-line'>
        <div>
          <h1 className='gb-h1 text-center'>
            Reset Password
          </h1>
          <p className='mt-2 text-center text-sm text-gb-muted'>
            Enter your email and we'll send you a recovery link.
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <input
              type='email'
              required
              className='appearance-none rounded-lg relative block w-full px-3 py-3 border border-[#9fb3bd] placeholder-slate-400 text-black focus:outline-none focus:ring-indigo-500 focus:border-gb-dark focus:z-10 sm:text-sm'
              placeholder='Email address'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <p className='text-emerald-700 text-xs font-bold text-center'>
              {message}
            </p>
          )}
          {error && (
            <p className='text-rose-700 text-xs font-bold text-center'>
              {error}
            </p>
          )}

          <div>
            <button
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-normal rounded-md text-white bg-gb-dark hover:bg-gb-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50'
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>

          <div className='text-center'>
            <Link
              to='/login'
              className='text-xs font-bold text-black hover:text-gb-darker transition-colors'
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
