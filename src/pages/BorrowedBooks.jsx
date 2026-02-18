import React, { useEffect, useState } from "react";

export default function BorrowedBooks() {
  const [books, setBooks] = useState([]); // Initialized as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBorrowed = async () => {
      const userData = JSON.parse(localStorage.getItem("user"));

      // Safety check for token
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

        const data = await response.json();

        if (response.ok) {
          // CRITICAL: Ensure data is an array before setting state
          setBooks(Array.isArray(data) ? data : []);
        } else {
          // Handle cases like "Token expired" or "Unauthorized"
          setError(data.msg || data.error || "Failed to fetch books");
        }
      } catch (err) {
        console.error("Fetch error:", err);
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
        // Update local UI immediately
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

  // 1. Loading State
  if (loading)
    return (
      <div className='flex justify-center py-20'>
        <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600'></div>
      </div>
    );

  // 2. Error State (Prevents the .map crash)
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

      {/* 3. Empty State Check */}
      {books.length === 0 ? (
        <div className='py-16 text-center border-2 border-dashed border-slate-100 rounded-[2rem]'>
          <p className='text-slate-300 font-bold text-xs uppercase tracking-[0.2em]'>
            Your library is empty
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {/* The .map() is now safe because we verified books is an array */}
          {books.map((book) => (
            <div
              key={book.record_id}
              className='group bg-white p-5 rounded-3xl border border-slate-100 flex items-center shadow-sm hover:border-indigo-200 transition-all'
            >
              <div className='w-16 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mr-5'>
                📖
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
                    <p className='text-[8px] font-black text-slate-400 uppercase'>
                      Due
                    </p>
                    <p className='text-[11px] font-bold text-rose-500'>
                      {formatDate(book.due_date)}
                    </p>
                  </div>
                  <div>
                    <p className='text-[8px] font-black text-slate-400 uppercase'>
                      Status
                    </p>
                    <p className='text-[11px] font-bold' style={{ color: book.status === "overdue" ? "#e11d48" : "#16a34a" }}>
                      {book.status === "overdue" ? "Overdue" : "Borrowed"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleReturn(book.record_id)}
                className='px-5 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 transition-all active:scale-95'
              >
                Return
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
