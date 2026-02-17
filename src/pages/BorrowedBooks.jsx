import React, { useEffect, useState } from "react";

export default function BorrowedBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrowed = async () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData?.token) return;

      try {
        const response = await fetch(
          "http://localhost:5000/api/user/borrowed-books",
          {
            headers: {
              Authorization: `Bearer ${userData.token}`,
            },
          },
        );
        const data = await response.json();
        setBooks(data);
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowed();
  }, []);

  // Helper to make dates look pretty
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading)
    return (
      <div className='flex justify-center py-10'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
      </div>
    );

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-sm font-black text-slate-800 uppercase italic'>
          My Active Borrows
        </h3>
        <span className='bg-indigo-100 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase'>
          {books.length} Books Total
        </span>
      </div>

      {books.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl'>
          <p className='text-slate-300 font-bold text-xs uppercase tracking-widest'>
            No books currently borrowed
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {books.map((book) => (
            <div
              key={book.record_id}
              className='group bg-white p-5 rounded-2xl border border-slate-100 flex items-center shadow-sm hover:border-indigo-200 transition-all'
            >
              {/* Book Icon/Image */}
              <div className='w-16 h-20 bg-slate-50 rounded-lg flex items-center justify-center text-3xl shadow-inner mr-5'>
                📚
              </div>

              {/* Info Section */}
              <div className='flex-1'>
                <h4 className='font-black text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors'>
                  {book.title}
                </h4>
                <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3'>
                  by {book.author}
                </p>

                {/* Date Labels */}
                <div className='flex gap-6'>
                  <div>
                    <p className='text-[9px] font-black text-slate-400 uppercase tracking-tighter'>
                      Borrowed On
                    </p>
                    <p className='text-xs font-bold text-slate-700'>
                      {formatDate(book.borrow_date)}
                    </p>
                  </div>
                  <div>
                    <p className='text-[9px] font-black text-slate-400 uppercase tracking-tighter'>
                      Return Due
                    </p>
                    <p className='text-xs font-bold text-rose-500'>
                      {formatDate(book.due_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className='ml-4 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 transition-all transform active:scale-95 shadow-lg shadow-slate-100'>
                Return
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
