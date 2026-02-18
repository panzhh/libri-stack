import React, { useEffect, useState } from "react";

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
          "http://localhost:5000/api/user/borrowed-books",
          {
            headers: {
              Authorization: `Bearer ${userData.token}`,
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
      } catch (err) {
        setError("Server connection failed.");
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowed();
  }, []);

  const handleReturn = async (recordId) => {
    const userData = JSON.parse(localStorage.getItem("user"));
    try {
      const response = await fetch(
        `http://localhost:5000/api/return/${recordId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${userData.token}` },
        },
      );

      if (response.ok) {
        setBooks((prev) => prev.filter((b) => b.record_id !== recordId));
      }
    } catch (err) {
      alert("Return failed. Please try again.");
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
        <p className='text-red-500 font-bold uppercase text-[10px] tracking-widest'>
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
        <span className='bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full'>
          {books.length} Active
        </span>
      </div>

      {books.length === 0 ? (
        <div className='py-16 text-center border-2 border-dashed border-slate-100 rounded-[2rem]'>
          <p className='text-slate-300 font-bold text-xs uppercase tracking-[0.2em]'>
            Your library is empty
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {books.map((book) => (
            <div
              key={book.record_id}
              className='group bg-white p-5 rounded-3xl border border-slate-100 flex items-center shadow-sm hover:border-indigo-200 transition-all'
            >
              <div className='w-16 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mr-5 overflow-hidden'>
                {book.uploadedImageUrl ? (
                  <img
                    src={book.uploadedImageUrl}
                    className='w-full h-full object-cover'
                    alt='cover'
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
                    <p className='text-[8px] font-black text-slate-400 uppercase'>
                      Borrowed
                    </p>
                    <p className='text-[11px] font-bold'>
                      {formatDate(book.borrow_date)}
                    </p>
                  </div>
                  <div>
                    <p className='text-[8px] font-black text-slate-400 uppercase text-rose-500'>
                      Due Date
                    </p>
                    <p className='text-[11px] font-bold text-rose-500'>
                      {formatDate(book.due_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={() => setSelectedBook(book)}
                  className='px-5 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all'
                >
                  Details
                </button>
                <button
                  onClick={() => handleReturn(book.record_id)}
                  className='px-5 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 transition-all active:scale-95'
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
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300'>
          <div className='bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95'>
            {/* Modal Header Section */}
            <div className='p-8 border-b-2 border-slate-100 flex gap-8 items-start bg-slate-50'>
              <div className='w-32 h-44 bg-white rounded-2xl shadow-md border-2 border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                {selectedBook.uploadedImageUrl ? (
                  <img
                    src={selectedBook.uploadedImageUrl}
                    className='w-full h-full object-cover'
                    alt='Book Cover'
                  />
                ) : (
                  <span className='text-5xl opacity-30'>📖</span>
                )}
              </div>
              <div className='flex-1'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h2 className='text-4xl font-black text-slate-900 leading-tight'>
                      {selectedBook.title}
                    </h2>
                    <p className='text-indigo-600 font-black uppercase tracking-[0.2em] text-sm mt-2'>
                      by {selectedBook.author}
                    </p>
                    {/* <div className='flex gap-3 mt-4'>
                      <span className='px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black uppercase text-indigo-600'>
                        Borrowing Status: {selectedBook.status}
                      </span>
                    </div> */}
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className='w-12 h-12 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-rose-600 transition-all text-2xl font-black'
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Details Grid */}
            <div className='p-10 overflow-y-auto bg-white flex-1'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8'>
                {[
                  { label: "Series", key: "series" },
                  { label: "Volume", key: "volume" },
                  { label: "Publisher", key: "publisher" },
                  { label: "Date Published", key: "datePublished" },
                  { label: "Genre", key: "genre" },
                  { label: "Language", key: "language" },
                  { label: "ISBN", key: "isbn" },
                  { label: "Pages", key: "numberOfPages" },
                  { label: "Original Price", key: "listPrice" },
                  { label: "Summary", key: "summary", fullWidth: true },
                  { label: "Notes", key: "notes", fullWidth: true },
                ].map((field) => {
                  const value = selectedBook[field.key];
                  return (
                    <div
                      key={field.key}
                      className={`border-b-2 border-slate-50 pb-4 ${field.fullWidth ? "md:col-span-2 lg:col-span-3" : ""}`}
                    >
                      <p className='text-xs font-black uppercase tracking-widest text-slate-400 mb-2'>
                        {field.label}
                      </p>
                      <p className='text-base font-bold text-slate-900 leading-relaxed'>
                        {value || "N/A"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className='p-8 bg-slate-50 border-t-2 border-slate-100 flex justify-end'>
              <button
                onClick={() => setSelectedBook(null)}
                className='px-14 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl'
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
