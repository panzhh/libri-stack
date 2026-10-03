import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, authHeaders, coverUrl, showFallbackCover } from "../api";

const BOOKS_PER_PAGE = 20;

export default function Home() {
  const navigate = useNavigate(); // Initialize the redirect tool
  const [books, setBooks] = useState([]); // the pages loaded so far
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [languages, setLanguages] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState("All");
  const [availability, setAvailability] = useState("in-stock");
  const [sortBy, setSortBy] = useState("title");
  const [selectedBook, setSelectedBook] = useState(null);
  // The book pop-up has two modes: "view" (borrow) and "order" (request copies)
  const [modalMode, setModalMode] = useState("view");
  const [orderForm, setOrderForm] = useState({ copies: 1, notes: "" });
  const [orderStatus, setOrderStatus] = useState({ type: "", msg: "" });
  const [sendingOrder, setSendingOrder] = useState(false);
  const [orderStep, setOrderStep] = useState("form"); // form -> confirm -> sent

  const openBook = (book, mode) => {
    setSelectedBook(book);
    setModalMode(mode);
    setOrderForm({ copies: 1, notes: "" });
    setOrderStatus({ type: "", msg: "" });
    setOrderStep("form");
  };

  // Unit price and total for the confirmation step (null when unknown)
  const unitPrice = Number(selectedBook?.listPriceUsd);
  const hasPrice = Number.isFinite(unitPrice) && unitPrice > 0;
  const orderTotal = hasPrice
    ? unitPrice * Number(orderForm.copies || 0)
    : null;
  const money = (n) => `$${n.toFixed(2)}`;

  const submitOrder = async () => {
    setSendingOrder(true);
    setOrderStatus({ type: "", msg: "" });
    try {
      const response = await fetch(`${API_URL}/api/book-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          book_id: selectedBook.id,
          title: selectedBook.title,
          author: selectedBook.author,
          language: selectedBook.language,
          copies: orderForm.copies,
          notes: orderForm.notes,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setOrderStep("sent");
        setOrderStatus({
          type: "success",
          msg: `Thank you! Your order number is ${data.order_number}. Your request for ${data.copies} ${data.copies === 1 ? "copy" : "copies"} will be collected by the library on ${data.collection_date} at 8:00 PM ET. You can change or delete it in My Orders until then.`,
        });
      } else {
        setOrderStatus({ type: "error", msg: data.error || data.msg });
      }
    } catch {
      setOrderStatus({ type: "error", msg: "Could not reach the server." });
    } finally {
      setSendingOrder(false);
    }
  };
  const latestRequest = useRef(0); // ignore responses that arrive out of order
  const modalBody = useRef(null);

  // Each order step starts at the top of the pop-up
  useEffect(() => {
    modalBody.current?.scrollTo(0, 0);
  }, [orderStep]);

  // Wait until the user pauses typing before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load one page of the catalog from the server (filtered and sorted there)
  const loadPage = async (pageNumber) => {
    const requestId = ++latestRequest.current;
    const params = new URLSearchParams({
      page: pageNumber,
      per_page: BOOKS_PER_PAGE,
      search: debouncedSearch,
      language: selectedLang,
      availability,
      sort: sortBy,
    });
    try {
      const response = await fetch(`${API_URL}/api/catalog?${params}`);
      const data = await response.json();
      if (requestId !== latestRequest.current) return;
      setBooks((prev) =>
        pageNumber === 1 ? data.books : [...prev, ...data.books],
      );
      setTotal(data.total);
      setHasMore(data.has_more);
      setPage(pageNumber);
      setLanguages(["All", ...data.languages]);
    } catch (err) {
      console.error("Error loading books:", err);
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // Start again from page 1 whenever a filter changes
  useEffect(() => {
    setLoading(true);
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedLang, availability, sortBy]);

  const showMore = () => {
    setLoadingMore(true);
    loadPage(page + 1);
  };

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
      const response = await fetch(`${API_URL}/api/borrow/${bookId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        // THE FIX: Send the userId in the body so Flask's request.json isn't empty
        body: JSON.stringify({
          userId: userData.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the UI locally so the stock number drops immediately
        setBooks((prev) =>
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

  return (
    <div className="max-w-7xl mx-auto px-6 pt-12 sm:pt-16 pb-12 font-sans">
      {/* WELCOME HERO */}
      <section className="mb-16 bg-slate-200/85 backdrop-blur-sm p-8 sm:p-14 rounded-[3rem] border-2 border-white shadow-xl animate-in fade-in duration-700">
        <p className="text-base font-black uppercase tracking-[0.2em] text-indigo-700 mb-4">
          Welcome
        </p>
        <h1 className="text-4xl sm:text-6xl font-black italic text-slate-900 uppercase tracking-tighter leading-none">
          Church in Dunn Loring <span className="text-indigo-600">Library</span>
        </h1>
      </section>

      {/* CATALOG HEADING */}
      <div id="catalog" className="scroll-mt-6 mb-4 px-2">
        <h2 className="text-3xl font-black italic text-white uppercase tracking-tight drop-shadow">
          The <span className="text-indigo-300">Collection</span>
        </h2>
        <p className="text-lg font-bold text-white mt-1 drop-shadow">
          {loading
            ? "Loading books..."
            : `${total.toLocaleString()} matching ${total === 1 ? "book" : "books"}`}
        </p>
      </div>

      {/* FILTER CONTROLS (Your Original Section) */}

      <div className="mb-8 flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-4 items-center bg-slate-200 p-5 rounded-[2rem] border-2 border-slate-400 shadow-sm">
        <div className="flex flex-col w-full sm:w-auto">
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-1 ml-2">
            Language
          </label>
          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
            }}
            className="bg-white border-2 border-slate-500 text-slate-900 focus:border-indigo-700 px-4 py-3 rounded-xl font-bold text-base outline-none cursor-pointer transition-all"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col w-full sm:w-auto">
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-1 ml-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
            }}
            className="bg-white border-2 border-slate-500 text-slate-900 focus:border-indigo-700 px-4 py-3 rounded-xl font-bold text-base outline-none cursor-pointer transition-all"
          >
            <option value="title">Title (A–Z)</option>
            <option value="section">Section</option>
          </select>
        </div>
        <div className="flex flex-col w-full sm:w-auto">
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-1 ml-2">
            Available
          </label>
          <select
            value={availability}
            onChange={(e) => {
              setAvailability(e.target.value);
            }}
            className="bg-white border-2 border-slate-500 text-slate-900 focus:border-indigo-700 px-4 py-3 rounded-xl font-bold text-base outline-none cursor-pointer transition-all"
          >
            <option value="in-stock">In-Stock Only</option>
            <option value="out-of-stock">Out-of-Stock Only</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="flex flex-col w-full lg:w-auto lg:flex-1 lg:min-w-[300px] lg:ml-4">
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-1 ml-2">
            Search Books
          </label>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="w-full bg-white border-2 border-slate-500 text-slate-900 placeholder:text-slate-600 focus:border-indigo-700 px-5 py-3 rounded-xl font-bold text-lg outline-none transition-all pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* LOADING / NO RESULTS */}
      {loading && books.length === 0 && (
        <div className="flex flex-col items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white font-black text-lg uppercase tracking-widest drop-shadow">
            Loading books...
          </p>
        </div>
      )}
      {!loading && books.length === 0 && (
        <div className="bg-slate-200 border-2 border-slate-400 rounded-[2rem] p-10 text-center">
          <p className="text-xl font-black text-slate-900">No books found.</p>
          <p className="text-lg text-slate-800 mt-2">
            Try a different search, language or availability.
          </p>
        </div>
      )}

      {/* BOOK GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-slate-200 border-2 border-slate-400 p-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all flex flex-col"
          >
            <div className="flex gap-4 mb-4">
              {/* Small cover in the top-left corner */}
              <div className="w-20 h-28 shrink-0 bg-slate-300 rounded-xl border border-slate-400 overflow-hidden flex items-center justify-center text-5xl leading-none">
                {book.uploadedImageUrl ? (
                  <img
                    src={coverUrl(book.id)}
                    className="w-full h-full object-cover"
                    alt=""
                    loading="lazy"
                    onError={showFallbackCover}
                  />
                ) : (
                  "📖"
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`mb-1 text-sm font-black uppercase tracking-wider ${(book.copies || 0) > 0 ? "text-emerald-700" : "text-rose-700"}`}
                >
                  {(book.copies || 0) > 0
                    ? `${book.copies} In Stock`
                    : "Out of Stock"}
                </p>
                <h3 className="font-black text-xl leading-snug line-clamp-3 text-slate-900 break-words">
                  {book.title}
                </h3>
                <p className="text-slate-700 text-base font-bold italic mt-1 truncate">
                  by {book.author || "Unknown"}
                </p>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <button
                onClick={() => openBook(book, "view")}
                className="w-full text-sm font-black uppercase tracking-wider bg-blue-700 border-2 border-blue-700 text-white px-4 py-3 rounded-xl hover:bg-blue-800 hover:border-blue-800 transition-colors shadow-lg"
              >
                View &amp; Borrow
              </button>
              {/* Ask the library to order (more) copies of this book */}
              <button
                onClick={() => openBook(book, "order")}
                className="w-full text-sm font-black uppercase tracking-wider bg-white border-2 border-slate-900 text-slate-900 px-4 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
              >
                Order Book
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SHOW MORE */}
      {!loading && books.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-4 bg-slate-200 border-2 border-slate-400 p-6 rounded-[2rem] shadow-sm">
          <p className="text-lg font-black text-slate-900">
            Showing {books.length.toLocaleString()} of {total.toLocaleString()}{" "}
            {total === 1 ? "book" : "books"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {hasMore && (
              <button
                onClick={showMore}
                disabled={loadingMore}
                className="w-full sm:w-auto px-6 sm:px-10 py-4 bg-slate-900 border-2 border-slate-900 text-white text-lg font-black uppercase tracking-wider rounded-2xl hover:bg-indigo-600 hover:border-indigo-600 transition-colors disabled:bg-slate-500 disabled:cursor-wait"
              >
                {loadingMore ? "Loading..." : "Show more books"}
              </button>
            )}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 text-lg font-black uppercase tracking-wider rounded-2xl hover:bg-slate-900 hover:text-white transition-colors"
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                ↑
              </span>
              Back to top
            </button>
          </div>
        </div>
      )}

      {/* MODAL (Restored all fields) */}

      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-200 w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Header Section */}
            <div className="p-6 border-b-2 border-slate-400 flex gap-5 items-start bg-slate-300">
              <div className="w-24 h-32 bg-slate-200 rounded-2xl shadow-md border-2 border-slate-400 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {selectedBook.uploadedImageUrl ? (
                  <img
                    src={coverUrl(selectedBook.id)}
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
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight break-words">
                      {selectedBook.title}
                    </h2>
                    <p className="text-indigo-700 font-black text-base mt-2">
                      by {selectedBook.author}
                    </p>

                    {/* STOCK STATUS BADGES (borrowing only, not when ordering) */}
                    {modalMode === "view" && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="whitespace-nowrap px-3 py-1.5 bg-slate-200 border border-slate-400 rounded-xl text-sm font-black uppercase text-slate-800">
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
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    aria-label="Close"
                    className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-rose-600 transition-all text-2xl font-black"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Details */}
            <div
              ref={modalBody}
              className="p-6 sm:p-8 overflow-y-auto bg-slate-200 flex-1"
            >
              {(modalMode === "view" || orderStep === "form") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
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
                    if (value === null || value === undefined || value === "")
                      return null;
                    if (field.key === "listPriceUsd")
                      value = `$${Number(value).toFixed(2)}`;
                    if (typeof value === "string")
                      value = value.replace(/^https?:\/\/(www\.)?/, "");
                    return (
                      <div
                        key={field.key}
                        className={`border-b-2 border-slate-300 pb-3 ${field.fullWidth ? "sm:col-span-2" : ""}`}
                      >
                        <p className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1">
                          {field.label}
                        </p>
                        <p className="text-lg font-bold text-slate-900 leading-relaxed break-words">
                          {value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {modalMode === "order" && orderStep === "confirm" && (
                <div>
                  <h3 className="text-xl font-black uppercase text-slate-900 mb-4">
                    Please confirm your order
                  </h3>
                  <p className="mb-4 p-4 rounded-2xl text-base font-bold bg-indigo-50 border-2 border-indigo-200 text-indigo-900">
                    Orders are collected every Sunday at 8:00 PM ET. You can
                    change or delete your order in My Orders until then. Orders
                    placed after 8:00 PM on Sunday are collected the following
                    Sunday.
                  </p>
                  {orderStatus.type === "error" && (
                    <p className="mb-4 p-4 rounded-2xl text-base font-bold bg-red-50 border-2 border-red-200 text-red-700">
                      {orderStatus.msg}
                    </p>
                  )}
                  <dl className="bg-white border-2 border-slate-300 rounded-2xl divide-y-2 divide-slate-200">
                    {[
                      ["Book", selectedBook.title],
                      ["Author", selectedBook.author],
                      ["Language", selectedBook.language],
                      ["Copies", orderForm.copies],
                      [
                        "Price per copy",
                        hasPrice ? money(unitPrice) : "Not available",
                      ],
                      ["Notes", orderForm.notes.trim()],
                    ]
                      .filter(
                        ([, value]) =>
                          value !== null && value !== undefined && value !== "",
                      )
                      .map(([label, value]) => (
                        <div
                          key={label}
                          className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 px-4 py-3"
                        >
                          <dt className="text-base font-black uppercase tracking-wide text-slate-800 shrink-0">
                            {label}
                          </dt>
                          <dd className="text-lg font-bold text-slate-900 sm:text-right break-words min-w-0">
                            {value}
                          </dd>
                        </div>
                      ))}
                    <div className="flex justify-between items-center gap-4 px-4 py-4 bg-blue-50 rounded-b-2xl">
                      <dt className="text-lg font-black uppercase text-slate-900">
                        Total
                      </dt>
                      <dd className="text-2xl font-black text-blue-800">
                        {hasPrice ? money(orderTotal) : "Price not available"}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              {modalMode === "order" && orderStep !== "confirm" && (
                <div
                  className={
                    orderStep === "sent"
                      ? ""
                      : "mt-6 pt-6 border-t-2 border-slate-400"
                  }
                >
                  <h3 className="text-xl font-black uppercase text-slate-900 mb-4">
                    {orderStep === "sent" ? "Order placed" : "Order this book"}
                  </h3>
                  {!localStorage.getItem("token") ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <p className="text-lg font-bold text-slate-900 flex-1">
                        Please log in first to order books.
                      </p>
                      <Link
                        to="/login"
                        className="px-8 py-4 bg-slate-900 text-white text-base font-black uppercase tracking-wider rounded-2xl text-center hover:bg-blue-700 transition-colors"
                      >
                        Log In
                      </Link>
                    </div>
                  ) : orderStatus.type === "success" ? (
                    <p className="p-4 rounded-2xl text-base font-bold bg-green-50 border-2 border-green-200 text-green-800">
                      {orderStatus.msg}
                    </p>
                  ) : (
                    <>
                      <p className="mb-4 text-base font-bold text-slate-800">
                        Orders are collected every Sunday at 8:00 PM ET. You can
                        change or delete your order in My Orders until then.
                        Orders placed after 8:00 PM on Sunday are collected the
                        following Sunday.
                      </p>
                      <form
                        id="order-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setOrderStep("confirm");
                        }}
                        className="space-y-4"
                      >
                        {orderStatus.msg && (
                          <p className="p-4 rounded-2xl text-base font-bold bg-red-50 border-2 border-red-200 text-red-700">
                            {orderStatus.msg}
                          </p>
                        )}
                        <div>
                          <label className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1 block">
                            Copies <span className="text-rose-700">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="100"
                            step="1"
                            inputMode="numeric"
                            value={orderForm.copies}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                copies: e.target.value,
                              })
                            }
                            className="w-full sm:w-40 px-4 py-3 bg-white border-2 border-slate-400 text-slate-900 rounded-xl text-lg font-bold outline-none focus:border-indigo-700"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1 block">
                            Notes
                          </label>
                          <textarea
                            rows="3"
                            placeholder="Edition, or anything else we should know..."
                            value={orderForm.notes}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                notes: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-white border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 rounded-xl text-lg font-medium outline-none focus:border-indigo-700 resize-none"
                          ></textarea>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-5 sm:p-6 bg-slate-300 border-t-2 border-slate-400 flex justify-end gap-3">
              {modalMode === "order" && orderStep === "confirm" ? (
                <button
                  onClick={() => setOrderStep("form")}
                  disabled={sendingOrder}
                  className="px-6 py-4 bg-white border-2 border-slate-400 text-slate-900 rounded-2xl text-base font-black uppercase tracking-wider"
                >
                  Back
                </button>
              ) : (
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-6 py-4 bg-white border-2 border-slate-400 text-slate-900 rounded-2xl text-base font-black uppercase tracking-wider"
                >
                  Close
                </button>
              )}
              {modalMode === "order" && orderStep === "confirm" ? (
                <button
                  onClick={submitOrder}
                  disabled={sendingOrder}
                  className="whitespace-nowrap px-6 sm:px-8 py-4 rounded-2xl text-base font-black uppercase tracking-wide sm:tracking-wider transition-all shadow-xl bg-blue-700 text-white hover:bg-blue-800 disabled:bg-slate-500"
                >
                  {sendingOrder ? "Ordering..." : "Confirm Order"}
                </button>
              ) : modalMode === "order" ? (
                localStorage.getItem("token") &&
                orderStatus.type !== "success" && (
                  <button
                    type="submit"
                    form="order-form"
                    disabled={sendingOrder}
                    className="whitespace-nowrap px-6 sm:px-8 py-4 rounded-2xl text-base font-black uppercase tracking-wide sm:tracking-wider transition-all shadow-xl bg-blue-700 text-white hover:bg-blue-800 disabled:bg-slate-500"
                  >
                    Order
                  </button>
                )
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
