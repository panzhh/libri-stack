import React, { useEffect, useState } from "react";
import { API_URL, authHeaders, coverUrl, showFallbackCover } from "../api";

export default function BorrowedBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the Detail Modal
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    const fetchBorrowed = async () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData?.token) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/user/borrowed-books`,
          {
            headers: {
              ...authHeaders(),
              "Content-Type": "application/json",
            },
          },
        );

        if (response.status === 401) {
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return;
        }

        const data = await response.json();
        if (response.ok) {
          setBooks(Array.isArray(data) ? data : []);
        } else {
          setError(data.msg || data.error || "Failed to fetch books");
        }
      } catch {
        setError("Server connection failed.");
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowed();
  }, []);

  const handleReturn = async (recordId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/return/${recordId}`,
        {
          method: "POST",
          headers: authHeaders(),
        },
      );

      if (response.ok) {
        setBooks((prev) => prev.filter((b) => b.record_id !== recordId));
      }
    } catch {
      alert("Return failed. Please try again.");
    }
  };

  // --- NEW: HANDLE RENEW LOGIC ---
  const handleRenew = async (recordId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/renew/${recordId}`,
        {
          method: "POST",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        // Update local state: Update due_date and set renewed to true
        setBooks((prev) =>
          prev.map((b) =>
            b.record_id === recordId
              ? { ...b, due_date: data.new_due_date, renewed: true }
              : b,
          ),
        );
      } else {
        alert(data.message || data.error);
      }
    } catch {
      alert("Renewal failed. Please check your connection.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading)
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );

  if (error)
    return (
      <div className='p-8 text-center bg-red-50 rounded-3xl border border-red-100'>
        <p className='text-red-700 font-bold uppercase text-xs tracking-widest'>
          {error}
        </p>
      </div>
    );

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center mb-6'>
        <h3 className='text-sm font-black text-slate-800 uppercase italic'>
          Active Borrows
        </h3>
        <span className='bg-indigo-50 text-indigo-600 text-xs font-black px-3 py-1 rounded-full'>
          {books.length} Active
        </span>
      </div>

      {books.length === 0 ? (
        <div className='py-16 text-center border-2 border-dashed border-slate-100 rounded-[2rem]'>
          <p className='text-slate-800 font-bold text-xs uppercase tracking-[0.2em]'>
            Your library is empty
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {books.map((book) => (
            <div
              key={book.record_id}
              className='group bg-slate-200 p-5 rounded-3xl border border-slate-400 flex items-center shadow-sm hover:border-indigo-200 transition-all'
            >
              <div className='w-16 h-20 bg-slate-300 rounded-2xl flex items-center justify-center text-3xl mr-5 overflow-hidden'>
                {book.uploadedImageUrl ? (
                  <img
                    src={coverUrl(book.book_id)}
                    className='w-full h-full object-cover'
                    alt=''
                    onError={showFallbackCover}
                  />
                ) : (
                  "📖"
                )}
              </div>
              <div className='flex-1'>
                <h4 className='font-black text-slate-900 text-sm mb-1'>
                  {book.title}
                </h4>
                <div className='flex gap-4 mt-2'>
                  <div>
                    <p className='text-xs font-black text-slate-800 uppercase'>
                      Borrowed
                    </p>
                    <p className='text-xs font-bold'>
                      {formatDate(book.borrow_date)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs font-black text-slate-800 uppercase text-rose-700'>
                      Due Date
                    </p>
                    <p className='text-xs font-bold text-rose-700'>
                      {formatDate(book.due_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={() => setSelectedBook(book)}
                  className='px-5 py-3 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all'
                >
                  Details
                </button>

                {/* --- RENEW BUTTON: Only shows if book.renewed is false --- */}
                {!book.renewed && (
                  <button
                    onClick={() => handleRenew(book.record_id)}
                    className='px-5 py-3 bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all'
                  >
                    Renew
                  </button>
                )}

                <button
                  onClick={() => handleReturn(book.record_id)}
                  className='px-5 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 transition-all active:scale-95'
                >
                  Return
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL (Matches Homepage.jsx exactly) --- */}
      {selectedBook && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300'>
          <div className='bg-slate-200 w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95'>
            {/* Modal Header Section */}
            <div className='p-6 border-b-2 border-slate-400 flex gap-5 items-start bg-slate-300'>
              <div className='w-24 h-32 bg-slate-200 rounded-2xl shadow-md border-2 border-slate-400 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                {selectedBook.uploadedImageUrl ? (
                  <img
                    src={coverUrl(selectedBook.book_id)}
                    className='w-full h-full object-cover'
                    alt=''
                    onError={showFallbackCover}
                  />
                ) : (
                  <span className='text-5xl'>📖</span>
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex justify-between items-start gap-4'>
                  <div className='min-w-0'>
                    <h2 className='text-2xl sm:text-3xl font-black text-slate-900 leading-tight break-words'>
                      {selectedBook.title}
                    </h2>
                    <p className='text-indigo-700 font-black text-base mt-2'>
                      by {selectedBook.author}
                    </p>
                    <div className='flex flex-wrap gap-2 mt-3'>
                      <span className='whitespace-nowrap px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-black uppercase text-indigo-700'>
                        {selectedBook.status}
                      </span>
                      {selectedBook.renewed && (
                        <span className='whitespace-nowrap px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-black uppercase text-amber-800'>
                          Renewed Once
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    aria-label='Close'
                    className='w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-rose-600 transition-all text-2xl font-black'
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Details Grid */}
            <div className='p-6 sm:p-8 overflow-y-auto bg-slate-200 flex-1'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5'>
                {[
                  { label: "Borrowed On", key: "borrow_date" },
                  { label: "Due Date", key: "due_date" },
                  { label: "Series", key: "series" },
                  { label: "Volume", key: "volume" },
                  { label: "Publisher", key: "publisher" },
                  { label: "Genre", key: "genre" },
                  { label: "Language", key: "language" },
                  { label: "ISBN", key: "isbn" },
                  { label: "Pages", key: "numberOfPages" },
                  { label: "Price", key: "listPrice" },
                  { label: "Summary", key: "summary", fullWidth: true },
                ].map((field) => {
                  let value = selectedBook[field.key];
                  if (value === null || value === undefined || value === "") return null;
                  if (field.key === "listPrice") value = `$${Number(value).toFixed(2)}`;
                  if (typeof value === "string") value = value.replace(/^https?:\/\/(www\.)?/, "");
                  return (
                    <div
                      key={field.key}
                      className={`border-b-2 border-slate-300 pb-3 ${field.fullWidth ? "sm:col-span-2" : ""}`}
                    >
                      <p className='text-sm font-black uppercase tracking-widest text-slate-800 mb-1'>
                        {field.label}
                      </p>
                      <p className='text-lg font-bold text-slate-900 leading-relaxed break-words'>
                        {value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className='p-5 sm:p-6 bg-slate-300 border-t-2 border-slate-400 flex justify-end'>
              <button
                onClick={() => setSelectedBook(null)}
                className='px-8 py-4 bg-slate-900 text-white rounded-2xl text-base font-black uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-xl'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
