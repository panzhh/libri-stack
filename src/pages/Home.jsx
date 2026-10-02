import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, authHeaders, coverUrl, showFallbackCover } from "../api";

const ITEMS_PER_PAGE = 20;

export default function Home() {
  const navigate = useNavigate(); // Initialize the redirect tool
  const [bookData, setBookData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLang, setSelectedLang] = useState("All");
  const [availability, setAvailability] = useState("in-stock");
  const [sortBy, setSortBy] = useState("title");
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/books`)
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

    if (!user || user === "undefined") {
      alert("You must be logged in to borrow books!");
      navigate("/login");
      return;
    }

    // 2. If logged in, proceed with the borrow request
    try {
      const response = await fetch(
        `${API_URL}/api/borrow/${bookId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          // THE FIX: Send the userId in the body so Flask's request.json isn't empty
          body: JSON.stringify({
            userId: userData.id,
          }),
        },
      );

      const data = await response.json();

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
    const search = searchTerm.trim().toLowerCase();
    const filtered = bookData.filter((book) => {
      const matchesSearch =
        book.title?.toLowerCase().includes(search) ||
        book.author?.toLowerCase().includes(search);
      const matchesLang =
        selectedLang === "All" || book.language === selectedLang;
      const inStock = (book.copies || 0) > 0;
      const matchesStock =
        availability === "all" ||
        (availability === "in-stock" ? inStock : !inStock);
      return matchesSearch && matchesLang && matchesStock;
    });

    // Sections look like "07 - Concerning Life": order by the number, then the name
    const sectionNumber = (book) => {
      const n = parseInt(book.category, 10);
      return Number.isNaN(n) ? Infinity : n;
    };
    const byTitle = (a, b) => (a.title || "").localeCompare(b.title || "");

    return filtered.sort((a, b) => {
      if (sortBy === "section") {
        return (
          sectionNumber(a) - sectionNumber(b) ||
          (a.category || "").localeCompare(b.category || "") ||
          byTitle(a, b)
        );
      }
      return byTitle(a, b);
    });
  }, [searchTerm, selectedLang, availability, sortBy, bookData]);

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE) || 1;
  const goToPage = (page) => {
    setCurrentPage(page);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

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
    <div className='max-w-7xl mx-auto px-6 pt-12 sm:pt-16 pb-12 font-sans'>
      {/* WELCOME HERO */}
      <section className='mb-16 bg-slate-200/85 backdrop-blur-sm p-8 sm:p-14 rounded-[3rem] border-2 border-white shadow-xl animate-in fade-in duration-700'>
        <p className='text-base font-black uppercase tracking-[0.2em] text-indigo-700 mb-4'>
          Welcome
        </p>
        <h1 className='text-4xl sm:text-6xl font-black italic text-slate-900 uppercase tracking-tighter leading-none mb-10'>
          Church in Dunn Loring{" "}
          <span className='text-indigo-600'>Library</span>
        </h1>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <button
            onClick={() =>
              document
                .getElementById("catalog")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className='flex items-center justify-center px-4 py-5 bg-slate-900 text-white border-2 border-slate-900 text-lg font-black uppercase tracking-wider rounded-2xl hover:bg-indigo-600 hover:border-indigo-600 transition-colors shadow-lg text-center'
          >
            Browse Books
          </button>
          <Link
            to={localStorage.getItem("token") ? "/user-dashboard" : "/login"}
            className='flex items-center justify-center px-4 py-5 bg-white text-slate-900 border-2 border-slate-900 text-lg font-black uppercase tracking-wider rounded-2xl hover:bg-slate-900 hover:text-white transition-colors text-center'
          >
            Return Books
          </Link>
          <Link
            to='/order-books'
            className='flex items-center justify-center px-4 py-5 bg-white text-slate-900 border-2 border-slate-900 text-lg font-black uppercase tracking-wider rounded-2xl hover:bg-slate-900 hover:text-white transition-colors text-center'
          >
            Order Books
          </Link>
        </div>
      </section>

      {/* CATALOG HEADING */}
      <div id='catalog' className='scroll-mt-6 mb-4 px-2'>
        <h2 className='text-3xl font-black italic text-white uppercase tracking-tight drop-shadow'>
          The <span className='text-indigo-300'>Collection</span>
        </h2>
        <p className='text-lg font-bold text-white mt-1 drop-shadow'>
          {filteredBooks.length.toLocaleString()} matching{" "}
          {filteredBooks.length === 1 ? "book" : "books"}
        </p>
      </div>

      {/* FILTER CONTROLS (Your Original Section) */}

      <div className='mb-8 flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-4 items-center bg-slate-200 p-5 rounded-[2rem] border-2 border-slate-400 shadow-sm'>
        <div className='flex flex-col w-full sm:w-auto'>
          <label className='text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-1 ml-2'>
            Language
          </label>
          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
              setCurrentPage(1);
            }}
            className='bg-white border-2 border-slate-500 text-slate-900 focus:border-indigo-700 px-4 py-3 rounded-xl font-bold text-base outline-none cursor-pointer transition-all'
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div className='flex flex-col w-full sm:w-auto'>
          <label className='text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-1 ml-2'>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className='bg-white border-2 border-slate-500 text-slate-900 focus:border-indigo-700 px-4 py-3 rounded-xl font-bold text-base outline-none cursor-pointer transition-all'
          >
            <option value='title'>Title (A–Z)</option>
            <option value='section'>Section</option>
          </select>
        </div>
        <div className='flex flex-col w-full sm:w-auto'>
          <label className='text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-1 ml-2'>
            Available
          </label>
          <select
            value={availability}
            onChange={(e) => {
              setAvailability(e.target.value);
              setCurrentPage(1);
            }}
            className='bg-white border-2 border-slate-500 text-slate-900 focus:border-indigo-700 px-4 py-3 rounded-xl font-bold text-base outline-none cursor-pointer transition-all'
          >
            <option value='in-stock'>In-Stock Only</option>
            <option value='out-of-stock'>Out-of-Stock Only</option>
            <option value='all'>All</option>
          </select>
        </div>
        <div className='flex flex-col w-full lg:w-auto lg:flex-1 lg:min-w-[300px] lg:ml-4'>
          <label className='text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-1 ml-2'>
            Search Books
          </label>
          <div className='relative w-full'>
            <input
              type='text'
              placeholder='Search by title or author...'
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className='w-full bg-white border-2 border-slate-500 text-slate-900 placeholder:text-slate-600 focus:border-indigo-700 px-5 py-3 rounded-xl font-bold text-lg outline-none transition-all pr-14'
            />
            <span className='absolute right-4 top-1/2 -translate-y-1/2 text-2xl'>
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* BOOK GRID */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
        {currentBooks.map((book) => (
          <div
            key={book.id}
            className='bg-slate-200 border-2 border-slate-400 p-6 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all group'
          >
            <div className='aspect-square bg-slate-300 rounded-[2rem] mb-4 flex items-center justify-center text-[9.5rem] leading-none group-hover:scale-105 transition-transform border border-slate-400 overflow-hidden'>
              {book.uploadedImageUrl ? (
                <img
                  src={coverUrl(book.id)}
                  className='w-full h-full object-cover'
                  alt=''
                  loading='lazy'
                  onError={showFallbackCover}
                />
              ) : (
                "📖"
              )}
            </div>

            {/* Stock Status */}
            <p
              className={`mb-2 text-base font-black uppercase tracking-widest ${(book.copies || 0) > 0 ? "text-emerald-700" : "text-rose-700"}`}
            >
              {(book.copies || 0) > 0
                ? `${book.copies} In Stock`
                : "Out of Stock"}
            </p>

            <h3 className='font-black text-2xl leading-tight line-clamp-2 h-16 mb-2 text-slate-900'>
              {book.title}
            </h3>
            <p className='text-slate-700 text-lg font-bold italic mb-6'>
              by {book.author || "Unknown"}
            </p>

            <div className='flex flex-col gap-4 pt-4 border-t-2 border-slate-100'>
              {/* LARGE HIGH-CONTRAST BUTTONS */}
              <div className='flex gap-2'>
                <button
                  onClick={() => setSelectedBook(book)}
                  className='flex-1 text-sm font-black uppercase tracking-wider bg-slate-900 text-white px-4 py-4 rounded-xl hover:bg-indigo-600 transition-colors shadow-lg'
                >
                  View and Borrow
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <nav className='mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-200 border-2 border-slate-400 p-5 rounded-[2rem] shadow-sm'>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className='w-full sm:w-48 px-6 py-4 bg-slate-900 text-white text-lg font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed'
          >
            ← Previous
          </button>
          <p className='text-xl font-black text-slate-900 px-4 whitespace-nowrap'>
            Page {currentPage} of {totalPages}
          </p>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className='w-full sm:w-48 px-6 py-4 bg-slate-900 text-white text-lg font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed'
          >
            Next →
          </button>
        </nav>
      )}

      {/* MODAL (Restored all fields) */}

      {selectedBook && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300'>
          <div className='bg-slate-200 w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95'>
            {/* Header Section */}
            <div className='p-6 border-b-2 border-slate-400 flex gap-5 items-start bg-slate-300'>
              <div className='w-24 h-32 bg-slate-200 rounded-2xl shadow-md border-2 border-slate-400 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                {selectedBook.uploadedImageUrl ? (
                  <img
                    src={coverUrl(selectedBook.id)}
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

                    {/* STOCK STATUS BADGES */}
                    <div className='flex flex-wrap gap-2 mt-3'>
                      <span className='whitespace-nowrap px-3 py-1.5 bg-slate-200 border border-slate-400 rounded-xl text-sm font-black uppercase text-slate-800'>
                        Total: {selectedBook.copies || 0}
                      </span>
                      <span
                        className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-sm font-black uppercase border ${
                          (selectedBook.availableCopies || 0) > 0
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}
                      >
                        Available: {selectedBook.availableCopies || 0}
                      </span>
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

            {/* Scrollable Details */}
            <div className='p-6 sm:p-8 overflow-y-auto bg-slate-200 flex-1'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5'>
                {[
                  { label: "Series", key: "series" },
                  { label: "Volume", key: "volume" },
                  { label: "Publisher", key: "publisher" },
                  { label: "Genre", key: "genre" },
                  { label: "Language", key: "language" },
                  { label: "ISBN", key: "isbn" },
                  { label: "Pages", key: "numberOfPages" },
                  { label: "Price", key: "listPriceUsd" },
                  { label: "Summary", key: "summary", fullWidth: true },
                ].map((field) => {
                  let value = selectedBook[field.key];
                  if (value === null || value === undefined || value === "") return null;
                  if (field.key === "listPriceUsd") value = `$${Number(value).toFixed(2)}`;
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

            {/* Footer Actions */}
            <div className='p-5 sm:p-6 bg-slate-300 border-t-2 border-slate-400 flex justify-end gap-3'>
              <button
                onClick={() => setSelectedBook(null)}
                className='px-6 py-4 bg-white border-2 border-slate-400 text-slate-900 rounded-2xl text-base font-black uppercase tracking-wider'
              >
                Close
              </button>
              <button
                onClick={() => handleBorrow(selectedBook.id)}
                disabled={selectedBook.availableCopies <= 0}
                className={`px-8 py-4 rounded-2xl text-base font-black uppercase tracking-wider transition-all shadow-xl ${
                  selectedBook.availableCopies > 0
                    ? "bg-indigo-600 text-white hover:bg-slate-900"
                    : "bg-slate-200 text-slate-800 cursor-not-allowed"
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
