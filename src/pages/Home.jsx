import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

  // The header search box sends people here with ?q=...
  const [searchParams] = useSearchParams();
  const headerQuery = searchParams.get("q");
  useEffect(() => {
    if (headerQuery === null) return;
    setAvailability("all"); // a header search looks through the whole catalog
    setSearchTerm(headerQuery);
    setDebouncedSearch(headerQuery.trim());
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  }, [headerQuery]);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-12">
      {/* INTRO */}
      <section className="mb-10">
        <h1 className="gb-h1">Church in Dunn Loring Library</h1>
        <p className="text-lg leading-relaxed mt-4 max-w-4xl">
          Spiritual books, booklets and recordings for the church in Dunn
          Loring. Browse the collection below, borrow a book, or ask the library
          to order one for you.
        </p>
      </section>

      {/* CATALOG HEADING */}
      <div
        id="catalog"
        className="scroll-mt-6 mb-4 flex flex-wrap items-baseline gap-x-4"
      >
        <h2 className="gb-h2">Browse the collection</h2>
        <p className="text-lg text-gb-muted">
          {loading
            ? "Loading books..."
            : `${total.toLocaleString()} matching ${total === 1 ? "book" : "books"}`}
        </p>
      </div>

      {/* FILTER CONTROLS (Your Original Section) */}

      <div className="gb-box mb-8 p-5 flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-4 items-end">
        <div className="flex flex-col w-full sm:w-auto">
          <label className="gb-label">Language</label>
          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
            }}
            className="gb-input py-2.5 text-base cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col w-full sm:w-auto">
          <label className="gb-label">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
            }}
            className="gb-input py-2.5 text-base cursor-pointer"
          >
            <option value="title">Title (A–Z)</option>
            <option value="section">Section</option>
          </select>
        </div>
        <div className="flex flex-col w-full sm:w-auto">
          <label className="gb-label">Available</label>
          <select
            value={availability}
            onChange={(e) => {
              setAvailability(e.target.value);
            }}
            className="gb-input py-2.5 text-base cursor-pointer"
          >
            <option value="in-stock">In-Stock Only</option>
            <option value="out-of-stock">Out-of-Stock Only</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="flex flex-col w-full lg:w-auto lg:flex-1 lg:min-w-[300px] lg:ml-4">
          <label className="gb-label">Search Books</label>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="gb-input py-2.5 pr-12"
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xl"
              aria-hidden="true"
            >
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* LOADING / NO RESULTS */}
      {loading && books.length === 0 && (
        <div className="flex flex-col items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gb-dark mb-4"></div>
          <p className="text-lg font-bold">Loading books...</p>
        </div>
      )}
      {!loading && books.length === 0 && (
        <div className="gb-box p-10 text-center">
          <p className="text-xl font-bold">No books found.</p>
          <p className="text-lg mt-2">
            Try a different search, language or availability.
          </p>
        </div>
      )}

      {/* BOOK LIST */}
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10">
        {books.map((book) => (
          <li key={book.id} className="flex gap-5 py-5 border-b border-gb-line">
            <button
              onClick={() => openBook(book, "view")}
              className="w-20 h-28 shrink-0 bg-gb-box border border-gb-line rounded flex items-center justify-center text-4xl overflow-hidden"
              aria-label={`Details for ${book.title}`}
            >
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
            </button>

            <div className="min-w-0 flex-1">
              <button
                onClick={() => openBook(book, "view")}
                className="gb-link text-lg text-left leading-snug break-words"
              >
                {book.title}
              </button>
              <p className="text-base mt-1">
                {book.author || "Unknown author"}
              </p>
              <p
                className={`text-base mt-1 font-semibold ${(book.copies || 0) > 0 ? "text-emerald-800" : "text-gb-red"}`}
              >
                {(book.copies || 0) > 0
                  ? `${book.copies} in stock`
                  : "Out of stock"}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => openBook(book, "view")}
                  className="gb-btn py-2 px-4 text-sm"
                >
                  More details
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* SHOW MORE */}
      {!loading && books.length > 0 && (
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <p className="text-lg">
            Showing {books.length.toLocaleString()} of {total.toLocaleString()}{" "}
            {total === 1 ? "book" : "books"}
          </p>
          <div className="flex gap-3 sm:ml-auto">
            {hasMore && (
              <button
                onClick={showMore}
                disabled={loadingMore}
                className="gb-btn"
              >
                {loadingMore ? "Loading..." : "Show more books"}
              </button>
            )}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="gb-btn-light"
            >
              <span aria-hidden="true">↑</span> Back to top
            </button>
          </div>
        </div>
      )}

      {/* MODAL (Restored all fields) */}

      {selectedBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={(e) => e.target === e.currentTarget && setSelectedBook(null)}
        >
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-xl shadow-sm overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Header Section */}
            <div className="p-6 border-b-2 border-gb-line flex gap-5 items-start bg-gb-box">
              <div className="w-24 h-32 bg-white rounded-lg shadow-md border-2 border-gb-line flex-shrink-0 overflow-hidden flex items-center justify-center">
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
                    <h2 className="text-2xl sm:text-3xl font-bold text-black leading-tight break-words">
                      {selectedBook.title}
                    </h2>
                    {selectedBook.author && (
                      <p className="text-gb-darker font-bold text-base mt-2">
                        by {selectedBook.author}
                      </p>
                    )}

                    {/* STOCK STATUS BADGES (borrowing only, not when ordering) */}
                    {modalMode === "view" && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="whitespace-nowrap px-3 py-1.5 bg-white border border-gb-line rounded-xl text-sm font-bold text-black">
                          Total: {selectedBook.copies || 0}
                        </span>
                        <span
                          className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-sm font-bold  border ${
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
                    className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-gb-dark text-white hover:bg-rose-600 transition-all text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Details */}
            <div
              ref={modalBody}
              className="p-6 sm:p-8 overflow-y-auto bg-white flex-1"
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
              )}

              {modalMode === "order" && orderStep === "confirm" && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-4">
                    Please confirm your order
                  </h3>
                  <p className="mb-4 p-4 rounded-lg text-base font-bold bg-gb-box border-2 border-gb-line text-gb-darker">
                    Orders are collected every Sunday at 8:00 PM ET. You can
                    change or delete your order in My Orders until then. Orders
                    placed after 8:00 PM on Sunday are collected the following
                    Sunday.
                  </p>
                  {orderStatus.type === "error" && (
                    <p className="mb-4 p-4 rounded-lg text-base font-bold bg-red-50 border-2 border-red-200 text-red-700">
                      {orderStatus.msg}
                    </p>
                  )}
                  <dl className="bg-white border-2 border-gb-line rounded-lg divide-y-2 divide-slate-200">
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
                          <dt className="text-base font-bold text-black shrink-0">
                            {label}
                          </dt>
                          <dd className="text-lg font-bold text-black sm:text-right break-words min-w-0">
                            {value}
                          </dd>
                        </div>
                      ))}
                    <div className="flex justify-between items-center gap-4 px-4 py-4 bg-blue-50 rounded-b-2xl">
                      <dt className="text-lg font-bold text-black">Total</dt>
                      <dd className="text-2xl font-bold text-gb-darker">
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
                      : "mt-6 pt-6 border-t-2 border-gb-line"
                  }
                >
                  <h3 className="text-xl font-bold text-black mb-4">
                    {orderStep === "sent" ? "Order placed" : "Order this book"}
                  </h3>
                  {!localStorage.getItem("token") ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <p className="text-lg font-bold text-black flex-1">
                        Please log in first to order books.
                      </p>
                      <Link
                        to="/login"
                        className="px-8 py-4 bg-gb-dark text-white text-base font-bold rounded-lg text-center hover:bg-gb-dark transition-colors"
                      >
                        Log In
                      </Link>
                    </div>
                  ) : orderStatus.type === "success" ? (
                    <p className="p-4 rounded-lg text-base font-bold bg-green-50 border-2 border-green-200 text-green-800">
                      {orderStatus.msg}
                    </p>
                  ) : (
                    <>
                      <p className="mb-4 text-base font-bold text-black">
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
                          <p className="p-4 rounded-lg text-base font-bold bg-red-50 border-2 border-red-200 text-red-700">
                            {orderStatus.msg}
                          </p>
                        )}
                        <div>
                          <label className="text-sm font-bold text-black mb-1 block">
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
                            className="w-full sm:w-40 px-4 py-3 bg-white border-2 border-[#9fb3bd] text-black rounded-xl text-lg font-normal outline-none focus:border-gb-dark"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-black mb-1 block">
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
                            className="w-full px-4 py-3 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted rounded-xl text-lg font-medium outline-none focus:border-gb-dark resize-none"
                          ></textarea>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions (close with the ✕ or by clicking outside) */}
            {!(
              modalMode === "order" &&
              (orderStep === "sent" || !localStorage.getItem("token"))
            ) && (
              <div className="p-5 sm:p-6 bg-gb-box border-t-2 border-gb-line flex flex-wrap justify-end gap-3">
                {modalMode === "order" && orderStep === "confirm" && (
                  <button
                    onClick={() => setOrderStep("form")}
                    disabled={sendingOrder}
                    className="flex-1 sm:flex-none px-6 py-4 bg-white border-2 border-gb-line text-black rounded-lg text-base font-bold"
                  >
                    Back
                  </button>
                )}
                {modalMode === "order" && orderStep === "confirm" ? (
                  <button
                    onClick={submitOrder}
                    disabled={sendingOrder}
                    className="whitespace-nowrap px-6 sm:px-8 py-4 rounded-lg text-base font-bold transition-colors bg-gb-dark text-white hover:bg-gb-darker disabled:bg-slate-500"
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
                      className="whitespace-nowrap px-6 sm:px-8 py-4 rounded-lg text-base font-bold transition-colors bg-gb-dark text-white hover:bg-gb-darker disabled:bg-slate-500"
                    >
                      Order
                    </button>
                  )
                ) : (
                  <>
                    <button
                      onClick={() => openBook(selectedBook, "order")}
                      className="gb-btn-light flex-1 sm:flex-none px-6 py-4"
                    >
                      Order this book
                    </button>
                    <button
                      onClick={() => handleBorrow(selectedBook.id)}
                      disabled={selectedBook.availableCopies <= 0}
                      className={`w-full sm:w-auto px-6 sm:px-8 py-4 rounded-lg text-base font-bold transition-colors ${
                        selectedBook.availableCopies > 0
                          ? "bg-gb-dark text-white hover:bg-gb-darker"
                          : "bg-slate-200 text-gb-muted cursor-not-allowed"
                      }`}
                    >
                      {selectedBook.availableCopies > 0
                        ? "Borrow This Book"
                        : "Out of Stock"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
