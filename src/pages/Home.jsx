import React, { useState, useMemo, useEffect } from "react";

const ITEMS_PER_PAGE = 20;

export default function Home() {
  // --- NEW: DATABASE STATE ---
  const [bookData, setBookData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLang, setSelectedLang] = useState("All");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // --- NEW: FETCH FROM DATABASE ---
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

  // Derive unique languages (Now depends on the bookData state)
  const languages = useMemo(
    () =>
      [
        "All",
        ...new Set(bookData.map((book) => book.language || "Unknown")),
      ].sort(),
    [bookData], // Updated dependency
  );

  // Combined Filter Logic
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
  }, [searchTerm, selectedLang, showOnlyInStock, bookData]); // Added bookData to dependency

  // Pagination Logic
  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBooks = filteredBooks.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // --- NEW: LOADING STATE UI ---
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <p className='text-slate-400 font-black text-xs uppercase tracking-widest'>
            Loading Database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-6 pb-12'>
      {/* SEARCH SECTION */}
      <div className='flex flex-col md:flex-row justify-between items-center gap-6 mb-12'>
        <div>
          <h2 className='text-3xl font-black uppercase tracking-tighter italic'>
            Library Catalog
          </h2>
          <p className='text-slate-400 font-bold uppercase tracking-widest text-[10px]'>
            {filteredBooks.length} Books Found in Database
          </p>
        </div>
        <input
          type='text'
          placeholder='Search title or author...'
          className='w-full md:w-96 px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all shadow-sm'
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* FILTER CONTROLS */}
      <div className='mb-8 flex flex-col sm:flex-row gap-4 items-center bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-sm'>
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
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {currentBooks.map((book) => (
          <div
            key={book.id}
            className='bg-white border-2 border-slate-100 p-6 rounded-[2.5rem] hover:shadow-xl transition-all group'
          >
            <div className='aspect-square bg-slate-50 rounded-[2rem] mb-4 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform'>
              📖
            </div>
            <div className='flex justify-between items-center mb-1'>
              <span className='text-[9px] font-black text-indigo-500 uppercase tracking-widest'>
                {book.language || "N/A"}
              </span>
              <span
                className={`text-[9px] font-black uppercase ${(book.copies || 0) > 0 ? "text-emerald-500" : "text-rose-400"}`}
              >
                {(book.copies || 0) > 0
                  ? `${book.copies} In Stock`
                  : "Out of Stock"}
              </span>
            </div>
            <h3 className='font-black text-lg leading-tight line-clamp-2 h-12 mb-1'>
              {book.title}
            </h3>
            <p className='text-slate-400 text-xs font-bold italic mb-4'>
              by {book.author || "Unknown"}
            </p>
            <div className='flex justify-between items-center pt-4 border-t border-slate-50'>
              <span className='font-black text-slate-900'>
                $
                {book.listPriceUsd
                  ? Number(book.listPriceUsd).toFixed(2)
                  : "0.00"}
              </span>

              <button
                onClick={() => setSelectedBook(book)} // This "opens" the modal
                className='text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-indigo-600 transition-colors'
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className='mt-16 flex justify-center items-center gap-6'>
        <button
          disabled={currentPage === 1}
          onClick={() => {
            setCurrentPage((p) => p - 1);
            window.scrollTo(0, 0);
          }}
          className='w-12 h-12 flex items-center justify-center rounded-full border-2 border-slate-200 disabled:opacity-20 font-black hover:bg-white transition-all'
        >
          ←
        </button>
        <div className='text-center'>
          <p className='text-[10px] font-black uppercase tracking-widest text-slate-400'>
            Page
          </p>
          <p className='font-black text-xl'>
            {currentPage} <span className='text-slate-300'>/ {totalPages}</span>
          </p>
        </div>
        <button
          disabled={currentPage === totalPages}
          onClick={() => {
            setCurrentPage((p) => p + 1);
            window.scrollTo(0, 0);
          }}
          className='w-12 h-12 flex items-center justify-center rounded-full border-2 border-slate-200 disabled:opacity-20 font-black hover:bg-white transition-all'
        >
          →
        </button>
      </div>
      {/* BOOK DETAILS MODAL */}
      {/* BOOK DETAILS MODAL */}
      {selectedBook && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300'>
          <div className='bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300'>
            {/* Modal Header with Image */}
            <div className='p-8 border-b border-slate-100 flex gap-8 items-start bg-slate-50/50'>
              {/* Book Cover Image */}
              <div className='w-32 h-44 bg-white rounded-2xl shadow-md border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                {selectedBook.uploadedImageUrl ? (
                  <img
                    src={selectedBook.uploadedImageUrl}
                    alt={selectedBook.title}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <span className='text-4xl opacity-20'>📖</span>
                )}
              </div>

              <div className='flex-1'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h2 className='text-3xl font-black text-slate-800 leading-tight'>
                      {selectedBook.title}
                    </h2>
                    {selectedBook.subtitle && (
                      <p className='text-slate-500 font-bold text-sm italic'>
                        {selectedBook.subtitle}
                      </p>
                    )}
                    <p className='text-indigo-600 font-black uppercase tracking-[0.2em] text-xs mt-2'>
                      by {selectedBook.author}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className='w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-rose-50 hover:text-rose-500 transition-all text-xl font-bold border border-slate-100'
                  >
                    ✕
                  </button>
                </div>

                {/* NEW: Copies & Available Status Section */}
                <div className='mt-6 flex gap-3'>
                  <div className='bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm'>
                    <p className='text-[9px] font-black text-slate-400 uppercase tracking-tighter'>
                      Total Copies
                    </p>
                    <p className='text-lg font-black text-slate-700'>
                      {selectedBook.copies || 0}
                    </p>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-xl shadow-sm border ${selectedBook.availableCopies > 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}
                  >
                    <p
                      className={`text-[9px] font-black uppercase tracking-tighter ${selectedBook.availableCopies > 0 ? "text-emerald-500" : "text-rose-400"}`}
                    >
                      Available Now
                    </p>
                    <p
                      className={`text-lg font-black ${selectedBook.availableCopies > 0 ? "text-emerald-700" : "text-rose-700"}`}
                    >
                      {selectedBook.availableCopies || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className='p-8 overflow-y-auto'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6'>
                {[
                  { label: "Series", key: "series" },
                  { label: "Volume", key: "volume" },
                  { label: "Publisher", key: "publisher" },
                  { label: "Date Published", key: "datePublished" },
                  { label: "Year", key: "yearPublished" },
                  { label: "Genre", key: "genre" },
                  { label: "Edition", key: "edition" },
                  { label: "Editor", key: "editor" },
                  { label: "Language", key: "language" },
                  { label: "ISBN", key: "isbn" },
                  { label: "Rating", key: "rating" },
                  { label: "Category", key: "category" },
                  { label: "Price", key: "listPrice" },
                  { label: "Pages", key: "numberOfPages" },
                  { label: "Word Count", key: "wordCount" },
                  { label: "Summary", key: "summary", fullWidth: true },
                  { label: "Personal Notes", key: "notes", fullWidth: true },
                ].map((field) => {
                  const value = selectedBook[field.key];
                  //if (!value || value === 0) return null;

                  return (
                    <div
                      key={field.key}
                      className={`border-b border-slate-50 pb-3 ${field.fullWidth ? "md:col-span-2 lg:col-span-3" : ""}`}
                    >
                      <p className='text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1'>
                        {field.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className='p-6 bg-slate-50 border-t border-slate-100 flex justify-end'>
              <button
                onClick={() => setSelectedBook(null)}
                className='px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200'
              >
                Close Library Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
