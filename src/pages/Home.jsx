import React, { useState, useMemo } from "react";
import bookData from "../data/books.json"; // Adjusted path for the /pages folder

const ITEMS_PER_PAGE = 20;

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLang, setSelectedLang] = useState("All");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  // Derive unique languages for the dropdown
  const languages = useMemo(
    () => ["All", ...new Set(bookData.map((book) => book.language))].sort(),
    [],
  );

  // Combined Filter Logic (Search + Language + Stock)
  const filteredBooks = useMemo(() => {
    return bookData.filter((book) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search);
      const matchesLang =
        selectedLang === "All" || book.language === selectedLang;
      const matchesStock = showOnlyInStock ? book.copies > 0 : true;

      return matchesSearch && matchesLang && matchesStock;
    });
  }, [searchTerm, selectedLang, showOnlyInStock]);

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

  return (
    <div className='max-w-7xl mx-auto px-6 pb-12'>
      {/* SEARCH SECTION */}
      <div className='flex flex-col md:flex-row justify-between items-center gap-6 mb-12'>
        <div>
          <h2 className='text-3xl font-black uppercase tracking-tighter italic'>
            Library Catalog
          </h2>
          <p className='text-slate-400 font-bold uppercase tracking-widest text-[10px]'>
            {filteredBooks.length} Books Found
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
                {book.language}
              </span>
              <span
                className={`text-[9px] font-black uppercase ${book.copies > 0 ? "text-emerald-500" : "text-rose-400"}`}
              >
                {book.copies > 0 ? `${book.copies} In Stock` : "Out of Stock"}
              </span>
            </div>
            <h3 className='font-black text-lg leading-tight line-clamp-2 h-12 mb-1'>
              {book.title}
            </h3>
            <p className='text-slate-400 text-xs font-bold italic mb-4'>
              by {book.author}
            </p>
            <div className='flex justify-between items-center pt-4 border-t border-slate-50'>
              <span className='font-black text-slate-900'>
                $
                {book.listPriceUsd
                  ? Number(book.listPriceUsd).toFixed(2)
                  : "0.00"}
              </span>
              <button className='text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-indigo-600 transition-colors'>
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
    </div>
  );
}
