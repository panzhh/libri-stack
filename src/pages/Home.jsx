import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this to your imports

const ITEMS_PER_PAGE = 20;

export default function Home() {
  const navigate = useNavigate(); // Initialize the redirect tool
  const [bookData, setBookData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLang, setSelectedLang] = useState("All");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/books")
      .then((res) => res.json())
      .then((data) => {
        setBookData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error connecting to database:", err);
        setLoading(false);
      });
  }, []);

  const handleBorrow = async (bookId) => {
    // 1. Check if user is logged in
    const user = localStorage.getItem("user");
    const userData = JSON.parse(user);
    console.log("userData: ", userData);

    if (!user || user === "undefined") {
      alert("You must be logged in to borrow books!");
      navigate("/login");
      return;
    }

    // 2. If logged in, proceed with the borrow request
    try {
      const response = await fetch(
        `http://localhost:5000/api/borrow/${bookId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          // THE FIX: Send the userId in the body so Flask's request.json isn't empty
          body: JSON.stringify({
            userId: userData.id,
          }),
        },
      );

      const data = await response.json();
      console.log("data: ", data);

      if (response.ok) {
        // Update the UI locally so the stock number drops immediately
        setBookData((prev) =>
          prev.map((b) => {
            if (b.id === bookId) {
              return {
                ...b,
                // If availableCopies > 0, subtract 1. Otherwise, keep it 0.
                availableCopies:
                  b.availableCopies > 0 ? b.availableCopies - 1 : 0,
              };
            }
            return b;
          }),
        );
        setSelectedBook((prev) => ({
          ...prev,
          availableCopies:
            prev.availableCopies > 0 ? prev.availableCopies - 1 : 0,
        }));
        alert("Success! Book borrowed.");
        //setSelectedBook(null);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Connection error:", err);
    }
  };

  const languages = useMemo(
    () =>
      [
        "All",
        ...new Set(bookData.map((book) => book.language || "Unknown")),
      ].sort(),
    [bookData],
  );

  const filteredBooks = useMemo(() => {
    return bookData.filter((book) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        book.title?.toLowerCase().includes(search) ||
        book.author?.toLowerCase().includes(search);
      const matchesLang =
        selectedLang === "All" || book.language === selectedLang;
      const matchesStock = showOnlyInStock ? (book.copies || 0) > 0 : true;
      return matchesSearch && matchesLang && matchesStock;
    });
  }, [searchTerm, selectedLang, showOnlyInStock, bookData]);

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBooks = filteredBooks.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <p className='text-slate-900 font-black text-sm uppercase tracking-widest'>
            Loading Library...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-6 pb-12 font-sans'>
      {/* FILTER CONTROLS (Your Original Section) */}
      <div className='mb-8 mt-8 flex flex-col sm:flex-row gap-4 items-center bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-sm'>
        <div className='flex flex-col w-full sm:w-auto'>
          <label className='text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 ml-2'>
            Language
          </label>
          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
              setCurrentPage(1);
            }}
            className='appearance-none bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white px-4 py-2 rounded-xl font-bold text-sm outline-none cursor-pointer transition-all'
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div className='h-10 w-[2px] bg-slate-100 hidden sm:block mx-2'></div>
        <div className='flex items-center gap-3 w-full sm:w-auto py-2 sm:py-0'>
          <input
            type='checkbox'
            id='stock'
            className='w-6 h-6 accent-indigo-600 cursor-pointer'
            checked={showOnlyInStock}
            onChange={(e) => {
              setShowOnlyInStock(e.target.checked);
              setCurrentPage(1);
            }}
          />
          <label
            htmlFor='stock'
            className='text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer select-none'
          >
            In-Stock Only
          </label>
        </div>
      </div>

      {/* BOOK GRID */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
        {currentBooks.map((book) => (
          <div
            key={book.id}
            className='bg-white border-2 border-slate-200 p-6 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all group'
          >
            <div className='aspect-square bg-slate-50 rounded-[2rem] mb-4 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform border border-slate-100'>
              📖
            </div>

            {/* RESTORED: Stock Status & Language */}
            <div className='flex justify-between items-center mb-2'>
              <span className='text-xs font-black text-indigo-700 uppercase tracking-widest'>
                {book.language || "N/A"}
              </span>
              <span
                className={`text-xs font-black uppercase ${(book.copies || 0) > 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {(book.copies || 0) > 0
                  ? `${book.copies} In Stock`
                  : "Out of Stock"}
              </span>
            </div>

            <h3 className='font-black text-xl leading-tight line-clamp-2 h-14 mb-1 text-slate-900'>
              {book.title}
            </h3>
            <p className='text-slate-500 text-sm font-bold italic mb-6'>
              by {book.author || "Unknown"}
            </p>

            <div className='flex flex-col gap-4 pt-4 border-t-2 border-slate-100'>
              <span className='font-black text-2xl text-slate-900'>
                $
                {book.listPriceUsd
                  ? Number(book.listPriceUsd).toFixed(2)
                  : "0.00"}
              </span>

              {/* LARGE HIGH-CONTRAST BUTTONS */}
              <div className='flex gap-2'>
                <button
                  onClick={() => setSelectedBook(book)}
                  className='flex-1 text-xs font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-4 rounded-xl hover:bg-indigo-600 transition-colors shadow-lg'
                >
                  View and Borrow
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL (Restored all fields) */}

      {selectedBook && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300'>
          <div className='bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95'>
            {/* Header Section */}
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

                    {/* STOCK STATUS BADGES */}
                    <div className='flex gap-3 mt-4'>
                      <span className='px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500'>
                        Total: {selectedBook.copies || 0}
                      </span>
                      <span
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${
                          (selectedBook.availableCopies || 0) > 0
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : "bg-rose-50 border-rose-200 text-rose-500"
                        }`}
                      >
                        Available: {selectedBook.availableCopies || 0}
                      </span>
                    </div>
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

            {/* Scrollable Details */}
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
                  { label: "Price", key: "listPrice" },
                  { label: "Summary", key: "summary", fullWidth: true },
                  { label: "Notes", key: "notes", fullWidth: true },
                ].map((field) => {
                  const value = selectedBook[field.key];
                  //if (!value) return null;
                  return (
                    <div
                      key={field.key}
                      className={`border-b-2 border-slate-50 pb-4 ${field.fullWidth ? "md:col-span-2 lg:col-span-3" : ""}`}
                    >
                      <p className='text-xs font-black uppercase tracking-widest text-slate-400 mb-2'>
                        {field.label}
                      </p>
                      <p className='text-base font-bold text-slate-900 leading-relaxed'>
                        {value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className='p-8 bg-slate-50 border-t-2 border-slate-100 flex justify-end gap-4'>
              <button
                onClick={() => setSelectedBook(null)}
                className='px-10 py-5 bg-white border-2 border-slate-300 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest'
              >
                Close
              </button>
              <button
                onClick={() => handleBorrow(selectedBook.id)}
                disabled={selectedBook.availableCopies <= 0}
                className={`px-14 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl ${
                  selectedBook.availableCopies > 0
                    ? "bg-indigo-600 text-white hover:bg-slate-900"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {selectedBook.availableCopies > 0
                  ? "Borrow This Book"
                  : "Out of Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
