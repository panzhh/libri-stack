import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("overview");
  const [userSubTab, setUserSubTab] = useState("user");
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  // --- NEW EDITING STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // --- FETCH FUNCTIONS ---
  const fetchAdminProfile = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAdminProfile(data);
      }
    } catch (err) {
      console.error("Error fetching admin profile:", err);
    }
  };

  const fetchSystemData = async () => {
    const token = localStorage.getItem("token");
    try {
      const userRes = await fetch("http://localhost:5000/api/debug/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      const bookRes = await fetch("http://localhost:5000/api/books");
      const bookData = await bookRes.json();

      setUsers(Array.isArray(userData) ? userData : []);
      setBooks(Array.isArray(bookData) ? bookData : []);
    } catch (err) {
      console.error("Dashboard sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
    fetchSystemData();
  }, []);

  // --- NEW EDIT LOGIC ---
  const startEditing = (book) => {
    // Ensure we capture the price even if it's under the old 'listPrice' key
    const currentPrice = book.listPriceUsd || book.listPrice || "";
    setEditFormData({
      ...book,
      listPriceUsd: currentPrice,
    });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();

    // Create a submission object
    const dataToSend = { ...editFormData };

    if (dataToSend.listPriceUsd) {
      // Clean only the numbers and dots
      const cleanNumber = dataToSend.listPriceUsd
        .toString()
        .replace(/[^\d.]/g, "");
      // Re-concatenate for storage
      dataToSend.listPriceUsd = `${cleanNumber} $`;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/books/${editFormData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        },
      );

      const result = await response.json();

      if (response.ok) {
        alert("Success: Library records updated.");
        setIsEditing(false);
        // CRITICAL: Update the selectedBook state so the Detail View shows the new data
        setSelectedBook(dataToSend);
        fetchSystemData();
      } else {
        alert(`Validation Error: ${result.error || "Update failed"}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Connection error while updating.");
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Permanently delete user ${email}?`)) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/debug/delete-user?email=${email}`,
        { method: "DELETE" },
      );
      if (response.ok) fetchSystemData();
    } catch (err) {
      alert("Error deleting user.");
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Remove "${title}" from the library?`)) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/books/${bookId}`,
        { method: "DELETE" },
      );
      if (response.ok) fetchSystemData();
    } catch (err) {
      alert("Error deleting book.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- FILTER LOGIC ---
  const filteredUsers = users.filter((u) => {
    const matchesRole = u.role === userSubTab;
    const matchesSearch =
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const filteredBooks = books.filter(
    (b) =>
      b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      {/* Sidebar */}
      <aside className='w-72 bg-slate-900 text-white p-8 flex flex-col sticky top-0 h-screen overflow-y-auto'>
        <div className='mb-12'>
          <h1 className='text-2xl font-black italic tracking-tighter'>
            LIBRI<span className='text-rose-500'>STACK</span>
          </h1>
          <p className='text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]'>
            Control Panel
          </p>
        </div>
        <nav className='flex-1 space-y-6'>
          <div>
            <p className='text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4'>
              Main Menu
            </p>
            <ul className='space-y-2'>
              <li
                onClick={() => {
                  setActiveTab("overview");
                  setSearchQuery("");
                }}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${activeTab === "overview" ? "bg-rose-500 text-white border-rose-500 shadow-lg" : "text-slate-400 hover:text-white border-transparent"}`}
              >
                Dashboard Overview
              </li>
              <li
                onClick={() => {
                  setActiveTab("users");
                  setSearchQuery("");
                }}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${activeTab === "users" ? "bg-rose-500 text-white border-rose-500 shadow-lg" : "text-slate-400 hover:text-white border-transparent"}`}
              >
                User Management
              </li>
              <li
                onClick={() => {
                  setActiveTab("inventory");
                  setSearchQuery("");
                }}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${activeTab === "inventory" ? "bg-rose-500 text-white border-rose-500 shadow-lg" : "text-slate-400 hover:text-white border-transparent"}`}
              >
                Book Inventory
              </li>
            </ul>
          </div>
          <div>
            <p className='text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4'>
              Personal
            </p>
            <ul className='space-y-2'>
              <li
                onClick={() => setActiveTab("profile")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${activeTab === "profile" ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white border-transparent"}`}
              >
                My Profile
              </li>
            </ul>
          </div>
        </nav>
        <button
          onClick={handleLogout}
          className='mt-auto p-4 bg-slate-800 hover:bg-rose-600 transition-all rounded-2xl text-sm font-black uppercase tracking-widest'
        >
          Logout Session
        </button>
      </aside>

      <main className='flex-1 p-12 overflow-y-auto'>
        <header className='flex justify-between items-center mb-12'>
          <h2 className='text-3xl font-black text-slate-800 uppercase tracking-tighter'>
            {activeTab === "profile"
              ? "Admin Profile"
              : activeTab === "overview"
                ? "System Dashboard"
                : activeTab === "inventory"
                  ? "Book Inventory"
                  : "User Management"}
          </h2>
        </header>

        {/* --- SEARCH BAR --- */}
        {(activeTab === "users" || activeTab === "inventory") && (
          <div className='relative w-full max-w-md mb-10'>
            <span className='absolute inset-y-0 left-4 flex items-center text-slate-400'>
              🔍
            </span>
            <input
              type='text'
              placeholder='Search records...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-sm'
            />
          </div>
        )}

        {/* --- OVERVIEW --- */}
        {activeTab === "overview" && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in'>
            <div className='bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm'>
              <div className='w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mb-6'>
                👥
              </div>
              <h3 className='text-slate-400 font-black text-[10px] uppercase mb-1'>
                Total Members
              </h3>
              <p className='text-4xl font-black text-slate-800'>
                {users.length}
              </p>
            </div>
            <div className='bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm'>
              <div className='w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl mb-6'>
                📖
              </div>
              <h3 className='text-slate-400 font-black text-[10px] uppercase mb-1'>
                Books in Catalog
              </h3>
              <p className='text-4xl font-black text-slate-800'>
                {books.length}
              </p>
            </div>
          </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === "users" && (
          <section className='bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 animate-in fade-in'>
            {/* ... Existing User Table Code ... */}
          </section>
        )}

        {/* --- INVENTORY TAB --- */}
        {activeTab === "inventory" && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in'>
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className='bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group'
              >
                <div className='aspect-square bg-slate-50 rounded-[2rem] mb-4 flex items-center justify-center text-5xl border border-slate-100 overflow-hidden'>
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
                <h4 className='font-black text-slate-900 truncate uppercase'>
                  {book.title}
                </h4>
                <p className='text-slate-500 text-xs font-bold italic mb-6'>
                  by {book.author || "Unknown"}
                </p>
                <div className='space-y-2'>
                  <button
                    onClick={() => setSelectedBook(book)}
                    className='w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 transition-all shadow-md'
                  >
                    View Details
                  </button>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => startEditing(book)}
                      className='flex-1 py-3 border-2 border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className='px-4 py-3 border-2 border-slate-100 text-rose-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-50 transition-all'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW MODAL --- */}
        {selectedBook && !isEditing && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in'>
            <div className='bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col'>
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
              <div className='p-10 overflow-y-auto bg-white flex-1'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6'>
                  {[
                    { label: "Series", key: "series" },
                    { label: "Volume", key: "volume" },
                    { label: "Publisher", key: "publisher" },
                    { label: "Date Published", key: "datePublished" },
                    { label: "Genre", key: "genre" },
                    { label: "Language", key: "language" },
                    { label: "ISBN", key: "isbn" },
                    { label: "Pages", key: "numberOfPages" },
                    { label: "Price (USD)", key: "listPriceUsd" },
                    { label: "Total Stock", key: "copies" },
                    { label: "Available Stock", key: "availableCopies" },
                    { label: "Summary", key: "summary", fullWidth: true },
                    { label: "Notes", key: "notes", fullWidth: true },
                  ].map((field) => (
                    <div
                      key={field.key}
                      className={`border-b border-slate-50 pb-2 ${field.fullWidth ? "md:col-span-2 lg:col-span-3" : ""}`}
                    >
                      <p className='text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1'>
                        {field.label}
                      </p>
                      <p className='text-sm font-bold text-slate-800 leading-relaxed'>
                        {field.key === "listPriceUsd"
                          ? selectedBook.listPriceUsd ||
                            selectedBook.listPrice ||
                            "---"
                          : selectedBook[field.key] || "---"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className='p-8 bg-slate-50 border-t-2 border-slate-100 flex justify-end gap-4'>
                <button
                  onClick={() => startEditing(selectedBook)}
                  className='px-10 py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl'
                >
                  Edit Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- EDIT MODAL --- */}
        {isEditing && (
          <div className='fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in'>
            <form
              onSubmit={handleUpdateBook}
              className='bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col'
            >
              <div className='p-8 border-b-2 border-slate-100 flex gap-8 items-start bg-indigo-50/50'>
                <div className='flex-1'>
                  <h2 className='text-3xl font-black text-slate-900 uppercase tracking-tighter'>
                    Editing Record
                  </h2>
                  <div className='grid grid-cols-2 gap-4 mt-4'>
                    <div className='flex flex-col'>
                      <label className='text-[10px] font-black uppercase text-slate-400 ml-2 mb-1'>
                        Title
                      </label>
                      <input
                        type='text'
                        name='title'
                        value={editFormData.title || ""}
                        onChange={handleInputChange}
                        className='bg-white border-2 border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-600'
                        required
                      />
                    </div>
                    <div className='flex flex-col'>
                      <label className='text-[10px] font-black uppercase text-slate-400 ml-2 mb-1'>
                        Author
                      </label>
                      <input
                        type='text'
                        name='author'
                        value={editFormData.author || ""}
                        onChange={handleInputChange}
                        className='bg-white border-2 border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-600'
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className='p-10 overflow-y-auto bg-white flex-1'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6'>
                  {[
                    { label: "Series", key: "series" },
                    { label: "Volume", key: "volume" },
                    { label: "Publisher", key: "publisher" },
                    { label: "Date Published", key: "datePublished" },
                    { label: "Genre", key: "genre" },
                    { label: "Language", key: "language" },
                    { label: "ISBN", key: "isbn" },
                    { label: "Pages", key: "numberOfPages" },
                    {
                      label: "Price (USD)",
                      key: "listPriceUsd",
                      type: "number",
                      step: "0.01",
                    },
                    { label: "Total Stock", key: "copies", type: "number" },
                    {
                      label: "Available Stock",
                      key: "availableCopies",
                      type: "number",
                    },
                    { label: "Image URL", key: "uploadedImageUrl" },
                    {
                      label: "Summary",
                      key: "summary",
                      fullWidth: true,
                      isTextArea: true,
                    },
                    {
                      label: "Notes",
                      key: "notes",
                      fullWidth: true,
                      isTextArea: true,
                    },
                  ].map((field) => (
                    <div
                      key={field.key}
                      className={`${field.fullWidth ? "md:col-span-2 lg:col-span-3" : ""}`}
                    >
                      <label className='text-[10px] font-black uppercase text-slate-400 mb-1 block ml-2'>
                        {field.label}
                      </label>
                      {field.isTextArea ? (
                        <textarea
                          name={field.key}
                          value={editFormData[field.key] || ""}
                          onChange={handleInputChange}
                          rows='4'
                          className='w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-medium outline-none focus:border-indigo-600 focus:bg-white transition-all'
                        />
                      ) : (
                        <input
                          type={field.type || "text"}
                          name={field.key}
                          value={
                            field.key === "listPriceUsd" &&
                            editFormData[field.key]
                              ? editFormData[field.key]
                                  .toString()
                                  .replace(/[^\d.]/g, "")
                              : editFormData[field.key] || ""
                          }
                          onChange={handleInputChange}
                          className='w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all'
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className='p-8 bg-slate-50 border-t-2 border-slate-100 flex justify-end gap-4'>
                <button
                  type='button'
                  onClick={() => setIsEditing(false)}
                  className='px-10 py-5 bg-white border-2 border-slate-300 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-14 py-5 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl'
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
