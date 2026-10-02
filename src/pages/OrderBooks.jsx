import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { STATUS_STYLES } from "../utils/requestStatus";
import { API_URL, authHeaders } from "../api";

const emptyForm = { title: "", author: "", notes: "" };

export default function OrderBooks() {
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState(emptyForm);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const fetchRequests = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/user/book-requests`,
        { headers: authHeaders() },
      );
      if (response.ok) setRequests(await response.json());
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });
    try {
      const response = await fetch(`${API_URL}/api/book-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus({
          type: "success",
          msg: "Thank you! Your request has been sent to the library team.",
        });
        setFormData(emptyForm);
        setRequests((prev) => [data, ...prev]);
      } else {
        setStatus({ type: "error", msg: data.error || data.msg });
      }
    } catch (error) {
      console.error("Request error:", error);
      setStatus({ type: "error", msg: "Could not reach the server." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-5 py-4 bg-white border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 focus:border-indigo-700 rounded-2xl outline-none font-bold text-lg transition-all";
  const labelClass =
    "text-base font-black text-slate-800 uppercase ml-2 mb-1 block";

  if (!token) {
    return (
      <div className='max-w-xl mx-auto px-6 py-20'>
        <div className='bg-slate-200 p-8 sm:p-12 rounded-[3rem] border-2 border-slate-400 shadow-xl text-center'>
          <h2 className='text-4xl font-black uppercase italic tracking-tighter mb-4'>
            Order <span className='text-indigo-600'>Books</span>
          </h2>
          <p className='text-lg text-black mb-8'>
            Please log in to ask the library to order a book.
          </p>
          <Link
            to='/login'
            className='inline-block px-10 py-5 bg-slate-900 text-white text-lg font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-colors'
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-xl mx-auto px-6 py-20 space-y-10'>
      <div className='bg-slate-200 p-8 sm:p-12 rounded-[3rem] border-2 border-slate-400 shadow-xl'>
        <h2 className='text-4xl font-black uppercase italic tracking-tighter mb-2'>
          Order <span className='text-indigo-600'>Books</span>
        </h2>
        <p className='text-lg text-black mb-8'>
          Can't find a book in our collection? Tell us what you're looking for
          and the library team will try to order it.
        </p>

        {status.msg && (
          <div
            className={`p-4 rounded-2xl mb-6 text-base font-bold ${
              status.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className={labelClass}>
              Book Title <span className='text-rose-700'>*</span>
            </label>
            <input
              type='text'
              required
              placeholder='e.g. The Normal Christian Life'
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Author</label>
            <input
              type='text'
              placeholder='e.g. Watchman Nee'
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              rows='3'
              placeholder='Language, edition, how many copies...'
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className={`${inputClass} resize-none`}
            ></textarea>
          </div>
          <button
            type='submit'
            disabled={loading}
            className='w-full py-5 mt-4 bg-slate-900 text-white text-lg font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all disabled:opacity-50'
          >
            {loading ? "Sending..." : "Send Request"}
          </button>
        </form>
      </div>

      <div className='bg-slate-200 p-8 sm:p-12 rounded-[3rem] border-2 border-slate-400 shadow-xl'>
        <h3 className='text-2xl font-black uppercase italic tracking-tight mb-6'>
          My <span className='text-indigo-600'>Requests</span>
        </h3>
        {requests.length === 0 ? (
          <p className='text-lg text-slate-800'>
            You haven't requested any books yet.
          </p>
        ) : (
          <ul className='space-y-4'>
            {requests.map((r) => (
              <li
                key={r.id}
                className='border-2 border-slate-100 rounded-2xl p-5'
              >
                <div className='flex justify-between items-start gap-4'>
                  <div>
                    <p className='text-lg font-black text-slate-900'>
                      {r.title}
                    </p>
                    {r.author && (
                      <p className='text-base text-slate-800 italic'>
                        by {r.author}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-lg border text-sm font-black uppercase tracking-wider ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className='text-sm text-slate-800 mt-2'>
                  Requested {r.date}
                </p>
                {r.admin_note && (
                  <p className='text-base text-black mt-2 bg-slate-300 p-3 rounded-xl'>
                    <span className='font-bold'>Library note:</span>{" "}
                    {r.admin_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
