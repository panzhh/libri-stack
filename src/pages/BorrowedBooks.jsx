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
        const response = await fetch(`${API_URL}/api/user/borrowed-books`, {
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
        });

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
      const response = await fetch(`${API_URL}/api/return/${recordId}`, {
        method: "POST",
        headers: authHeaders(),
      });

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
      const response = await fetch(`${API_URL}/api/renew/${recordId}`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
      });
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gb-dark"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-700 font-bold text-xs ">
          {error}
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-black ">
          Active Borrows
        </h3>
        <span className="bg-gb-box text-gb-darker text-xs font-bold px-3 py-1 rounded-full">
          {books.length} Active
        </span>
      </div>

      {books.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-gb-line rounded-xl">
          <p className="text-black font-bold text-xs ">
            Your library is empty
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {books.map((book) => (
            <div
              key={book.record_id}
              className="group bg-white p-4 sm:p-5 rounded-xl border border-gb-line flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:border-gb-line transition-all"
            >
              {/* Phones: book info on top, buttons underneath */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-20 shrink-0 bg-gb-box rounded-lg flex items-center justify-center text-3xl overflow-hidden">
                  {book.uploadedImageUrl ? (
                    <img
                      src={coverUrl(book.book_id)}
                      className="w-full h-full object-cover"
                      alt=""
                      onError={showFallbackCover}
                    />
                  ) : (
                    "📖"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-black text-lg leading-snug break-words mb-1">
                    {book.title}
                  </h4>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                    <div>
                      <p className="text-sm font-bold text-black ">
                        Borrowed
                      </p>
                      <p className="text-base font-bold text-black whitespace-nowrap">
                        {formatDate(book.borrow_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-700">
                        Due Date
                      </p>
                      <p className="text-base font-bold text-rose-700 whitespace-nowrap">
                        {formatDate(book.due_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedBook(book)}
                  className="flex-1 sm:flex-none px-2 sm:px-4 py-3 bg-white border-2 border-gb-line text-black text-sm font-bold sm: rounded-xl hover:bg-gb-dark hover:border-gb-dark hover:text-white transition-all"
                >
                  Details
                </button>

                {/* --- RENEW BUTTON: Only shows if book.renewed is false --- */}
                {!book.renewed && (
                  <button
                    onClick={() => handleRenew(book.record_id)}
                    className="flex-1 sm:flex-none px-2 sm:px-4 py-3 bg-gb-box border-2 border-gb-line text-gb-darker text-sm font-bold sm: rounded-xl hover:bg-gb-dark hover:text-white transition-all"
                  >
                    Renew
                  </button>
                )}

                <button
                  onClick={() => handleReturn(book.record_id)}
                  className="flex-1 sm:flex-none px-2 sm:px-4 py-3 bg-gb-dark border-2 border-gb-dark text-white text-sm font-bold sm: rounded-xl hover:bg-rose-600 hover:border-rose-600 transition-all active:scale-95"
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-xl shadow-sm overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Modal Header Section */}
            <div className="p-6 border-b-2 border-gb-line flex gap-5 items-start bg-gb-box">
              <div className="w-24 h-32 bg-white rounded-lg shadow-md border-2 border-gb-line flex-shrink-0 overflow-hidden flex items-center justify-center">
                {selectedBook.uploadedImageUrl ? (
                  <img
                    src={coverUrl(selectedBook.book_id)}
                    className="w-full h-full object-cover"
                    alt=""
                    onError={showFallbackCover}
                  />
                ) : (
                  <span className="text-5xl">📖</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold text-black leading-tight break-words">
                      {selectedBook.title}
                    </h2>
                    <p className="text-gb-darker font-bold text-base mt-2">
                      by {selectedBook.author}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="whitespace-nowrap px-3 py-1.5 bg-gb-box border border-gb-line rounded-xl text-sm font-bold text-gb-darker">
                        {selectedBook.status}
                      </span>
                      {selectedBook.renewed && (
                        <span className="whitespace-nowrap px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-amber-800">
                          Renewed Once
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    aria-label="Close"
                    className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-gb-dark text-white hover:bg-rose-600 transition-all text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Details Grid */}
            <div className="p-6 sm:p-8 overflow-y-auto bg-white flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
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
                  if (value === null || value === undefined || value === "")
                    return null;
                  if (field.key === "listPrice")
                    value = `$${Number(value).toFixed(2)}`;
                  if (typeof value === "string")
                    value = value.replace(/^https?:\/\/(www\.)?/, "");
                  return (
                    <div
                      key={field.key}
                      className={`border-b-2 border-gb-line pb-3 ${field.fullWidth ? "sm:col-span-2" : ""}`}
                    >
                      <p className="text-sm font-bold text-black mb-1">
                        {field.label}
                      </p>
                      <p className="text-lg font-bold text-black leading-relaxed break-words">
                        {value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 bg-gb-box border-t-2 border-gb-line flex justify-end">
              <button
                onClick={() => setSelectedBook(null)}
                className="px-8 py-4 bg-gb-dark text-white rounded-lg text-base font-bold hover:bg-gb-dark transition-all shadow-sm"
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
