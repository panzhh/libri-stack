import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [borrowSearch, setBorrowSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // options: "all", "borrowed", "returned"

  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("overview");
  const [userSubTab, setUserSubTab] = useState("user");
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  // --- NEW: EMAIL SELECTION & SERVER STATE ---
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContent, setEmailContent] = useState({ subject: "", body: "" });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // --- EDITING STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All"); // Options: "All", "In Stock", "Out of Stock"

  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    category: "",
    language: "English",
    copies: 1,
    isbn: "",
    summary: "",
    uploadedImageUrl: "",
    listPriceUsd: 0.0, // Added for your float column
  });

  const [contactMessages, setContactMessages] = useState([]);

  const fetchMessages = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/contact_messages",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setContactMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Call this inside your existing useEffect when the tab changes
  useEffect(() => {
    if (activeTab === "messages") fetchMessages();
  }, [activeTab]);

  // --- FIELD DEFINITIONS ---
  const bookFields = [
    { label: "Title", key: "title", required: true },
    { label: "Author", key: "author", required: true },
    { label: "Series", key: "series" },
    { label: "Volume", key: "volume" },
    { label: "Publisher", key: "publisher" },
    { label: "Date Published", key: "datePublished" },
    { label: "Genre", key: "genre" },
    { label: "Language", key: "language" },
    { label: "ISBN", key: "isbn" },
    { label: "Price (USD)", key: "listPriceUsd" },
    { label: "Total Stock", key: "copies", type: "number" },
    { label: "Available Stock", key: "availableCopies", type: "number" },
    { label: "Pages", key: "numberOfPages", type: "number" },
    { label: "Image URL", key: "uploadedImageUrl" },
    { label: "Summary", key: "summary", fullWidth: true, isTextArea: true },
    { label: "Notes", key: "notes", fullWidth: true, isTextArea: true },
  ];

  const [borrowRecords, setBorrowRecords] = useState([]);
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

  const handleReturnBook = async (recordId) => {
    if (!window.confirm("Confirm this book has been returned?")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/return-book/${recordId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Refresh the borrow records to show the updated status
        fetchBorrowRecords();
        // Also refresh system data to update available book counts
        fetchSystemData();
        alert("Success: Book marked as returned.");
      } else {
        alert("Failed to update record.");
      }
    } catch (err) {
      console.error("Error returning book:", err);
    }
  };

  const fetchBorrowRecords = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/borrow-records",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setBorrowRecords(data);
    } catch (err) {
      console.error("Error fetching borrow records:", err);
    }
  };

  // --- HANDLERS ---
  const handleAddBookSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const payload = {
      ...newBook,
      availableCopies: newBook.copies,
      listPrice: `${newBook.listPriceUsd} $`,
      dateAdded: new Date().toISOString().split("T")[0],
    };

    try {
      const response = await fetch("http://localhost:5000/api/admin/add-book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      console.log(response);

      if (response.ok) {
        alert("✨ Book added to LibriStack!");
        setNewBook({
          title: "",
          author: "",
          category: "",
          language: "English",
          copies: 1,
          isbn: "",
          summary: "",
          uploadedImageUrl: "",
          listPriceUsd: 0.0,
        });
        setActiveTab("inventory");
        // fetchBooks(); // Trigger a refresh of your list
      }
    } catch (err) {
      console.error("Error saving book:", err);
    }
  };

  // Call this inside your useEffect
  useEffect(() => {
    fetchAdminProfile();
    fetchSystemData();
    fetchBorrowRecords(); // Add this
  }, []);

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

  // --- EMAIL SERVER LOGIC ---
  const toggleUserSelection = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const handleConfirmSendEmail = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setIsSendingEmail(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/send-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipients: selectedEmails,
            subject: emailContent.subject,
            message: emailContent.body,
          }),
        },
      );
      if (response.ok) {
        alert(`Success: Message sent to ${selectedEmails.length} users.`);
        setIsEmailModalOpen(false);
        setSelectedEmails([]);
        setEmailContent({ subject: "", body: "" });
      }
    } catch (err) {
      alert("Server error sending email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // --- EDIT & DELETE LOGIC (ORIGINAL) ---
  const startEditing = (book) => {
    setEditFormData({ ...book });
    setIsEditing(true);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    const dataToSend = { ...editFormData };
    if (dataToSend.listPriceUsd) {
      const cleanNumber = dataToSend.listPriceUsd
        .toString()
        .replace(/[^\d.]/g, "");
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
      if (response.ok) {
        alert("Success: Library records updated.");
        setIsEditing(false);
        setSelectedBook(dataToSend);
        fetchSystemData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (email) => {
    const loggedInEmail = localStorage.getItem("userEmail");

    if (email === loggedInEmail) {
      alert(
        "Safety Protocol: You cannot delete the account you are currently logged into.",
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${targetEmail}?`))
      return;
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
    // Always ask for confirmation before destructive actions
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/delete-book/${bookId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("Book removed from registry.");
        // Refresh the book list so the UI updates
        fetchSystemData();
      } else {
        // Show the specific error message from Flask (e.g., active loans exist)
        alert(`Error: ${data.error || "Failed to delete book"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error while deleting book.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- FILTER LOGIC (ORIGINAL) ---
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

  const filteredBorrowRecords = borrowRecords.filter((record) => {
    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;
    const matchesSearch =
      record.user_name.toLowerCase().includes(borrowSearch.toLowerCase()) ||
      record.book_title.toLowerCase().includes(borrowSearch.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const filteredInventory = books.filter((book) => {
    const matchesSearch =
      book.title?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      book.author?.toLowerCase().includes(inventorySearch.toLowerCase());

    const matchesLanguage =
      languageFilter === "All" || book.language === languageFilter;

    const matchesStock =
      stockFilter === "All" ||
      (stockFilter === "In Stock"
        ? book.availableCopies > 0
        : book.availableCopies === 0);

    return matchesSearch && matchesLanguage && matchesStock;
  });

  const handlePromoteUser = async (userId, name) => {
    const confirmPromote = window.confirm(
      `Are you sure you want to promote ${name} to ADMIN? This gives them full access to LibriStack.`,
    );

    if (!confirmPromote) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/promote-user/${userId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        alert(`${name} is now an Admin.`);
        fetchSystemData(); // Refresh the list so they move to the Admin tab
      } else {
        const errorData = await response.json();
        alert("Failed to promote: " + errorData.error);
      }
    } catch (err) {
      console.error("Promotion error:", err);
    }
  };

  const [myStats, setMyStats] = useState({ active: 0, total: 0 });

  const fetchMyAdminStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/user/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMyStats(data);
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "my-borrows") {
      fetchMyAdminStats();
    }
  }, [activeTab]);

  // Update your useEffect to include stats
  useEffect(() => {
    if (activeTab === "profile") {
      fetchMyAdminStats();
    }
  }, [activeTab]);

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      {/* Sidebar (ORIGINAL) */}
      <aside className='w-72 bg-slate-900 text-white p-8 flex flex-col sticky top-0 h-screen overflow-y-auto'>
        <div className='mb-12'>
          <h1 className='text-2xl font-black italic tracking-tighter'>
            Church in Dunn Loring<span className='text-rose-500'>Library</span>
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

              <li
                onClick={() => {
                  setActiveTab("borrowed");
                  setSearchQuery("");
                }}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "borrowed"
                    ? "bg-rose-500 text-white border-rose-500 shadow-lg"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Borrowed Books
              </li>

              <li
                onClick={() => setActiveTab("add-book")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "add-book"
                    ? "bg-rose-500 text-white border-rose-500 shadow-lg"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Add New Book
              </li>
              <li
                onClick={() => setActiveTab("messages")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "messages"
                    ? "bg-rose-500 text-white border-rose-500 shadow-lg"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Contact Messages
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

        {activeTab === "users" && (
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

        {/* --- OVERVIEW (ORIGINAL) --- */}
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

        {activeTab === "my-borrows" && (
          <section className='animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8'>
            {/* --- Personal Stats Bar (Reusing your /api/user/stats data) --- */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100'>
                <p className='text-[10px] font-black uppercase tracking-widest opacity-80'>
                  Active Borrows
                </p>
                <h4 className='text-4xl font-black mt-2'>{myStats.active}</h4>
              </div>
              <div className='bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200'>
                <p className='text-[10px] font-black uppercase tracking-widest opacity-60'>
                  Lifetime Collection
                </p>
                <h4 className='text-4xl font-black mt-2'>{myStats.total}</h4>
              </div>
            </div>

            {/* --- The Borrows List --- */}
            <div className='bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm'>
              <h3 className='text-xl font-black text-slate-800 uppercase italic mb-8'>
                Currently Reading
              </h3>

              {myBorrows.length === 0 ? (
                <div className='py-20 text-center'>
                  <p className='text-slate-400 font-black text-xs uppercase tracking-widest'>
                    Your shelf is empty
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {myBorrows.map((borrow) => (
                    <div
                      key={borrow.id}
                      className='flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-50 hover:border-emerald-200 transition-all'
                    >
                      <div className='flex items-center gap-6'>
                        <div className='w-12 h-16 bg-slate-200 rounded-lg overflow-hidden shadow-sm'>
                          <img
                            src={borrow.book_image}
                            alt=''
                            className='w-full h-full object-cover'
                          />
                        </div>
                        <div>
                          <h4 className='font-black text-slate-800 text-sm uppercase'>
                            {borrow.book_title}
                          </h4>
                          <p className='text-[10px] text-slate-400 font-bold uppercase'>
                            Due: {borrow.due_date}
                          </p>
                        </div>
                      </div>
                      <button className='px-6 py-2 bg-white border-2 border-slate-100 text-[10px] font-black uppercase rounded-xl hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all'>
                        Return Book
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* --- USERS TAB (ORIGINAL + EMAIL) --- */}
        {activeTab === "users" && (
          <section className='bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 animate-in fade-in'>
            <div className='flex justify-between items-center mb-10'>
              <h3 className='text-xl font-black text-slate-800 uppercase italic'>
                Database Records
              </h3>
              <div className='flex gap-4'>
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${selectedEmails.length > 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}
                >
                  Email Selected ({selectedEmails.length})
                </button>
                <div className='flex bg-slate-100 p-1.5 rounded-2xl'>
                  <button
                    onClick={() => setUserSubTab("user")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${userSubTab === "user" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                  >
                    Members
                  </button>
                  <button
                    onClick={() => setUserSubTab("admin")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${userSubTab === "admin" ? "bg-white text-rose-500 shadow-sm" : "text-slate-500"}`}
                  >
                    Admins
                  </button>
                </div>
              </div>
            </div>
            <table className='w-full text-left'>
              <thead>
                <tr className='text-[10px] font-black text-slate-400 border-b uppercase'>
                  <th className='pb-4'>Select</th>
                  <th className='pb-4'>Name</th>
                  <th className='pb-4'>Email</th>
                  <th className='pb-4'>Joined</th>
                  <th className='pb-4 text-right'>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className='border-b border-slate-50 hover:bg-slate-50 transition-colors'
                  >
                    <td className='py-5'>
                      <input
                        type='checkbox'
                        checked={selectedEmails.includes(u.email)}
                        onChange={() => toggleUserSelection(u.email)}
                      />
                    </td>
                    <td
                      className='py-5 font-bold text-slate-800 text-sm cursor-pointer hover:text-indigo-600 hover:underline transition-all'
                      onClick={() => setSelectedUser(u)}
                    >
                      {u.full_name}
                    </td>
                    <td className='py-5 text-sm text-slate-500'>{u.email}</td>
                    <td className='py-5 text-[10px] font-black text-slate-400 uppercase'>
                      {u.registration_date || "Unknown"}
                    </td>
                    <td className='py-5 text-right'>
                      <div className='flex justify-end gap-4'>
                        {/* Only show Promote button if the user is not an admin */}
                        {u.role === "user" && userSubTab === "user" && (
                          <button
                            onClick={() => handlePromoteUser(u.id, u.full_name)}
                            className='text-[9px] font-black text-indigo-600 uppercase hover:underline'
                          >
                            Promote
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u.email)}
                          className='text-[9px] font-black text-rose-500 uppercase hover:underline'
                        >
                          Delete
                        </button>
                      </div>
                      {/* <button
                        onClick={() => handleDeleteUser(u.email)}
                        className='text-[9px] font-black text-rose-500 uppercase hover:underline'
                      >
                        Delete
                      </button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* --- INVENTORY TAB (RESTORED ORIGINAL) --- */}
        {activeTab === "inventory" && (
          <div className='animate-in fade-in'>
            {/* --- FILTER BAR --- */}
            <div className='flex flex-wrap items-center gap-4 mb-10 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm'>
              {/* Search Input */}
              <div className='relative flex-1 min-w-[250px]'>
                <span className='absolute inset-y-0 left-4 flex items-center text-slate-400'>
                  🔍
                </span>
                <input
                  type='text'
                  placeholder='Search title or author...'
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className='w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20'
                />
              </div>

              {/* Language Filter */}
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className='px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-600 focus:outline-none'
              >
                <option value='All'>All Languages</option>
                <option value='English'>English</option>
                <option value='Chinese'>Chinese</option>
                {/* Add more as needed */}
              </select>

              {/* Stock Filter */}
              <div className='flex bg-slate-100 p-1 rounded-2xl'>
                {["All", "In Stock", "Out of Stock"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStockFilter(s)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                      stockFilter === s
                        ? "bg-white text-rose-500 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* --- BOOK GRID --- */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
              {filteredInventory.map((book) => (
                <div
                  key={book.id}
                  className='bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group'
                >
                  <div className='aspect-square bg-slate-50 rounded-[2rem] mb-4 flex items-center justify-center text-5xl border border-slate-100 overflow-hidden relative'>
                    {book.uploadedImageUrl ? (
                      <img
                        src={book.uploadedImageUrl}
                        className='w-full h-full object-cover'
                        alt='cover'
                      />
                    ) : (
                      "📖"
                    )}
                    {/* Quick Stock Badge */}
                    <div
                      className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                        book.availableCopies > 0
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {book.availableCopies > 0
                        ? `${book.availableCopies} Left`
                        : "Out of Stock"}
                    </div>
                  </div>

                  <h4 className='font-black text-slate-900 truncate uppercase text-sm'>
                    {book.title}
                  </h4>
                  <p className='text-slate-500 text-[10px] font-bold italic mb-6'>
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

            {/* Empty State */}
            {filteredInventory.length === 0 && (
              <div className='py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100'>
                <p className='text-slate-400 font-black text-xs uppercase tracking-widest'>
                  No books match those filters
                </p>
              </div>
            )}
          </div>
        )}

        {/* {activeTab === "inventory" && (
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
        )} */}

        {activeTab === "borrowed" && (
          <section className='bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 animate-in fade-in'>
            {/* Header & Filters */}
            <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10'>
              <div>
                <h3 className='text-xl font-black text-slate-800 uppercase italic leading-none'>
                  Loan Registry
                </h3>
                <p className='text-[10px] text-slate-400 font-bold uppercase mt-2'>
                  Monitoring {filteredBorrowRecords.length} Records
                </p>
              </div>

              <div className='flex flex-wrap items-center gap-4 w-full lg:w-auto'>
                {/* Search Bar */}
                <div className='relative flex-1 lg:w-64'>
                  <span className='absolute inset-y-0 left-4 flex items-center text-slate-400 text-xs'>
                    🔍
                  </span>
                  <input
                    type='text'
                    placeholder='Search borrower or book...'
                    value={borrowSearch}
                    onChange={(e) => setBorrowSearch(e.target.value)}
                    className='w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20'
                  />
                </div>

                {/* Status Toggle */}
                <div className='flex bg-slate-100 p-1 rounded-xl'>
                  {["all", "borrowed", "returned"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                        statusFilter === s
                          ? "bg-white text-rose-500 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className='overflow-x-auto'>
              <table className='w-full text-left'>
                <thead>
                  <tr className='text-[10px] font-black text-slate-400 border-b uppercase'>
                    <th className='pb-4'>Borrower Details</th>
                    <th className='pb-4'>Book Information</th>
                    <th className='pb-4'>Timeline</th>
                    <th className='pb-4'>Status</th>
                    <th className='pb-4 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBorrowRecords.map((record) => {
                    // 1. Logic to check if the book is late
                    const isOverdue =
                      record.status === "borrowed" &&
                      new Date(record.due_date) < new Date();

                    return (
                      <tr
                        key={record.id}
                        className={`border-b border-slate-50 transition-colors group ${
                          isOverdue
                            ? "bg-rose-50/30 hover:bg-rose-50/60"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* COLUMN: Borrower Details */}
                        <td className='py-5'>
                          <p className='font-bold text-slate-800 text-sm'>
                            {record.user_name}
                          </p>
                          <p className='text-[10px] text-indigo-500 font-black uppercase tracking-tighter'>
                            User ID: #{record.user_id}
                          </p>
                        </td>

                        {/* COLUMN: Book Information */}
                        <td className='py-5'>
                          <p className='font-black text-slate-700 text-[11px] uppercase truncate max-w-[200px]'>
                            {record.book_title}
                          </p>
                          <p className='text-[9px] text-slate-400 font-bold'>
                            Book ID: {record.book_id}
                          </p>
                        </td>

                        {/* COLUMN: Timeline */}
                        <td className='py-5'>
                          <div className='flex flex-col gap-1'>
                            <span className='text-[9px] font-bold text-slate-500 italic'>
                              Out: {record.borrow_date}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase flex items-center gap-1 ${
                                isOverdue ? "text-rose-600" : "text-slate-400"
                              }`}
                            >
                              Due: {record.due_date}
                              {isOverdue && (
                                <span className='animate-pulse'>⚠️ LATE</span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* COLUMN: Status Badge */}
                        <td className='py-5'>
                          <span
                            className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${
                              record.status === "borrowed"
                                ? "bg-amber-100 text-amber-600 shadow-sm border border-amber-200"
                                : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>

                        {/* COLUMN: Action Button */}
                        <td className='py-5 text-right'>
                          {record.status === "borrowed" ? (
                            <button
                              onClick={() => handleReturnBook(record.id)}
                              className={`text-[9px] font-black px-4 py-2 rounded-xl uppercase transition-all transform hover:scale-105 active:scale-95 shadow-sm ${
                                isOverdue
                                  ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200"
                                  : "bg-slate-900 text-white hover:bg-indigo-600"
                              }`}
                            >
                              Return Book
                            </button>
                          ) : (
                            <div className='flex flex-col items-end'>
                              <span className='text-[9px] font-black text-slate-300 uppercase tracking-widest'>
                                Archived
                              </span>
                              <span className='text-[8px] text-slate-400 italic'>
                                In: {record.return_date || "N/A"}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredBorrowRecords.length === 0 && (
              <div className='py-20 text-center'>
                <p className='text-slate-400 font-black text-xs uppercase tracking-widest'>
                  No records found matching your filters
                </p>
              </div>
            )}
          </section>
        )}

        {/* --- PROFILE TAB (ENHANCED WITH ALL DATA) --- */}
        {activeTab === "profile" && adminProfile && (
          <section className='bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in'>
            <div className='bg-slate-900 p-12 text-white flex items-center gap-8'>
              <div className='w-24 h-24 bg-rose-500 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-lg shadow-rose-500/20'>
                {adminProfile.full_name?.charAt(0)}
              </div>
              <div>
                <h3 className='text-3xl font-black tracking-tight'>
                  {adminProfile.full_name}
                </h3>
                <p className='text-rose-400 font-bold uppercase text-xs tracking-widest mt-1'>
                  Authorized {adminProfile.role}
                </p>
              </div>
            </div>
            <div className='p-12'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12'>
                <div>
                  <p className='text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1'>
                    Email
                  </p>
                  <p className='font-bold text-slate-800 text-lg'>
                    {adminProfile.email}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1'>
                    Phone
                  </p>
                  <p className='font-bold text-slate-800 text-lg'>
                    {adminProfile.phone || "---"}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1'>
                    Invite Code
                  </p>
                  <p className='font-black text-indigo-600 text-3xl tabular-nums'>
                    {adminProfile.own_invite_code || "---"}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1'>
                    Registered
                  </p>
                  <p className='font-bold text-slate-800 text-lg'>
                    {new Date(
                      adminProfile.registration_date,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1'>
                    Status
                  </p>
                  <p
                    className={`font-black uppercase text-xs ${adminProfile.is_verified ? "text-emerald-500" : "text-amber-500"}`}
                  >
                    {adminProfile.is_verified
                      ? "✓ Verified Admin"
                      : "⚠ Pending"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- VIEW MODAL (ORIGINAL) --- */}
        {selectedBook && !isEditing && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in'>
            <div className='bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col'>
              <div className='p-8 border-b-2 border-slate-100 flex gap-8 items-start bg-slate-50'>
                <div className='w-32 h-44 bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden flex items-center justify-center'>
                  {selectedBook.uploadedImageUrl ? (
                    <img
                      src={selectedBook.uploadedImageUrl}
                      className='w-full h-full object-cover'
                      alt='cover'
                    />
                  ) : (
                    <span className='text-5xl opacity-30'>📖</span>
                  )}
                </div>
                <div className='flex-1 flex justify-between items-start'>
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
                    className='w-12 h-12 flex items-center justify-center rounded-full bg-slate-900 text-white text-2xl font-black'
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className='p-10 overflow-y-auto bg-white flex-1'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6'>
                  {bookFields.map((field) => (
                    <div
                      key={field.key}
                      className={`border-b border-slate-50 pb-2 ${field.fullWidth ? "md:col-span-2 lg:col-span-3" : ""}`}
                    >
                      <p className='text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1'>
                        {field.label}
                      </p>
                      <p className='text-sm font-bold text-slate-800 leading-relaxed'>
                        {selectedBook[field.key] || "---"}
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

        {/* --- EDIT MODAL (ORIGINAL) --- */}
        {isEditing && (
          <div className='fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in'>
            <form
              onSubmit={handleUpdateBook}
              className='bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col'
            >
              <div className='p-10 overflow-y-auto bg-white flex-1'>
                <h2 className='text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8'>
                  Editing Full Record
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6'>
                  {bookFields.map((field) => (
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
                          className='w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-600'
                          required={field.required}
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

        {/* --- EMAIL BROADCAST MODAL --- */}
        {isEmailModalOpen && (
          <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in'>
            <form
              onSubmit={handleConfirmSendEmail}
              className='bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden'
            >
              <div className='p-8 bg-indigo-600 text-white'>
                <h2 className='text-2xl font-black uppercase'>Server Mailer</h2>
                <p className='text-indigo-200 text-[10px] font-bold uppercase'>
                  Sending to {selectedEmails.length} Users
                </p>
              </div>
              <div className='p-10 space-y-6'>
                <input
                  required
                  placeholder='Subject'
                  value={emailContent.subject}
                  onChange={(e) =>
                    setEmailContent({
                      ...emailContent,
                      subject: e.target.value,
                    })
                  }
                  className='w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none'
                />
                <textarea
                  required
                  rows='6'
                  placeholder='Message body...'
                  value={emailContent.body}
                  onChange={(e) =>
                    setEmailContent({ ...emailContent, body: e.target.value })
                  }
                  className='w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm outline-none resize-none'
                />
              </div>
              <div className='p-8 bg-slate-50 border-t flex gap-4'>
                <button
                  type='button'
                  onClick={() => setIsEmailModalOpen(false)}
                  className='flex-1 py-4 font-black uppercase text-xs'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isSendingEmail}
                  className='flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs'
                >
                  {isSendingEmail ? "Sending..." : "Send via Server"}
                </button>
              </div>
            </form>
          </div>
        )}
        {/* --- USER DETAIL MODAL --- */}
        {selectedUser && (
          <div className='fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in'>
            <div className='bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden'>
              {/* Header */}
              <div className='bg-slate-900 p-8 text-white flex justify-between items-center'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center font-black'>
                    {selectedUser.full_name?.charAt(0)}
                  </div>
                  <h2 className='text-xl font-black uppercase'>
                    {selectedUser.full_name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className='text-xl hover:text-rose-500'
                >
                  ✕
                </button>
              </div>

              {/* Grid Details */}
              <div className='p-10 grid grid-cols-2 gap-8'>
                <div>
                  <p className='text-[10px] font-black text-slate-400 uppercase mb-1'>
                    Email
                  </p>
                  <p className='font-bold text-slate-800'>
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className='text-[10px] font-black text-slate-400 uppercase mb-1'>
                    Role
                  </p>
                  <p className='font-bold text-indigo-600 uppercase'>
                    {selectedUser.role}
                  </p>
                </div>
                <div>
                  <p className='text-[10px] font-black text-slate-400 uppercase mb-1'>
                    Phone
                  </p>
                  <p className='font-bold text-slate-800'>
                    {selectedUser.phone || "---"}
                  </p>
                </div>
                <div>
                  <p className='text-[10px] font-black text-slate-400 uppercase mb-1'>
                    Invite Code
                  </p>
                  <p className='font-black text-slate-800'>
                    {selectedUser.own_invite_code || "---"}
                  </p>
                </div>
              </div>

              <div className='p-6 bg-slate-50 text-right'>
                <button
                  onClick={() => setSelectedUser(null)}
                  className='px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. ADD NEW BOOK TAB */}
        {activeTab === "add-book" && (
          <section className='bg-white rounded-[3rem] border border-slate-100 shadow-sm p-12 animate-in slide-in-from-bottom-6 duration-500'>
            <div className='max-w-5xl mx-auto'>
              <header className='mb-12'>
                <h3 className='text-3xl font-black text-slate-900 uppercase italic leading-none'>
                  Catalog New Title
                </h3>
                <p className='text-xs text-slate-400 font-bold uppercase mt-3 tracking-widest'>
                  Database entry / Global Library System
                </p>
              </header>

              <form
                onSubmit={handleAddBookSubmit}
                className='grid grid-cols-1 lg:grid-cols-3 gap-12'
              >
                {/* Left & Middle: Text Metadata */}
                <div className='lg:col-span-2 space-y-8'>
                  <div className='grid grid-cols-2 gap-6'>
                    <div className='col-span-2'>
                      <label className='text-[10px] font-black text-slate-400 uppercase ml-2'>
                        Main Title
                      </label>
                      <input
                        type='text'
                        required
                        value={newBook.title}
                        onChange={(e) =>
                          setNewBook({ ...newBook, title: e.target.value })
                        }
                        placeholder='Enter book title...'
                        className='w-full mt-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-rose-500/5 outline-none transition-all'
                      />
                    </div>
                    <div>
                      <label className='text-[10px] font-black text-slate-400 uppercase ml-2'>
                        Primary Author
                      </label>
                      <input
                        type='text'
                        required
                        value={newBook.author}
                        onChange={(e) =>
                          setNewBook({ ...newBook, author: e.target.value })
                        }
                        className='w-full mt-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none'
                      />
                    </div>
                    <div>
                      <label className='text-[10px] font-black text-slate-400 uppercase ml-2'>
                        ISBN-13
                      </label>
                      <input
                        type='text'
                        value={newBook.isbn}
                        onChange={(e) =>
                          setNewBook({ ...newBook, isbn: e.target.value })
                        }
                        placeholder='978-...'
                        className='w-full mt-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none'
                      />
                    </div>
                  </div>
                  <div>
                    <label className='text-[10px] font-black text-slate-400 uppercase ml-2'>
                      Language <span className='text-rose-500'>*</span>
                    </label>
                    <select
                      required
                      value={newBook.language}
                      onChange={(e) =>
                        setNewBook({ ...newBook, language: e.target.value })
                      }
                      className='w-full mt-2 px-4 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-rose-500/5 transition-all cursor-pointer'
                    >
                      <option value=''>Select Language</option>
                      <option value='English'>English</option>
                      <option value='Chinese'>Chinese</option>
                      <option value='Malay'>Malay</option>
                      <option value='French'>French</option>
                    </select>
                  </div>

                  <div>
                    <label className='text-[10px] font-black text-slate-400 uppercase ml-2'>
                      Book Summary
                    </label>
                    <textarea
                      rows='6'
                      value={newBook.summary}
                      onChange={(e) =>
                        setNewBook({ ...newBook, summary: e.target.value })
                      }
                      className='w-full mt-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium outline-none resize-none'
                    ></textarea>
                  </div>
                </div>

                {/* Right Column: Financials & Media */}
                <div className='space-y-8 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100'>
                  <div>
                    <label className='text-[10px] font-black text-slate-400 uppercase ml-2'>
                      Category / Genre
                    </label>
                    <input
                      type='text'
                      value={newBook.category}
                      onChange={(e) =>
                        setNewBook({ ...newBook, category: e.target.value })
                      }
                      placeholder='e.g. Science Fiction'
                      className='w-full mt-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-[10px] font-black text-slate-400 uppercase ml-2'>
                        Total Copies
                      </label>
                      <input
                        type='number'
                        min='1'
                        required
                        value={newBook.copies}
                        onChange={(e) =>
                          setNewBook({
                            ...newBook,
                            copies: parseInt(e.target.value),
                          })
                        }
                        className='w-full mt-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none'
                      />
                    </div>
                    <div>
                      <label className='text-[10px] font-black text-slate-400 uppercase ml-2'>
                        Price (USD)
                      </label>
                      <input
                        type='number'
                        step='0.01'
                        required
                        value={newBook.listPriceUsd}
                        onChange={(e) =>
                          setNewBook({
                            ...newBook,
                            listPriceUsd: parseFloat(e.target.value),
                          })
                        }
                        className='w-full mt-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='text-[10px] font-black text-slate-400 uppercase ml-2'>
                      Cover Image URL
                    </label>
                    <input
                      type='text'
                      value={newBook.uploadedImageUrl}
                      onChange={(e) =>
                        setNewBook({
                          ...newBook,
                          uploadedImageUrl: e.target.value,
                        })
                      }
                      className='w-full mt-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none'
                    />
                  </div>

                  <button
                    type='submit'
                    className='w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-600 transition-all shadow-xl shadow-slate-200 active:scale-95'
                  >
                    Confirm & Save Entry
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {activeTab === "messages" && (
          <section className='animate-in fade-in space-y-6'>
            <div className='flex justify-between items-center mb-8'>
              <h3 className='text-2xl font-black text-slate-900 uppercase italic'>
                Inbox
              </h3>
              <span className='bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase'>
                {contactMessages.length} Messages
              </span>
            </div>

            <div className='grid grid-cols-1 gap-4'>
              {contactMessages.length === 0 ? (
                <div className='py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100'>
                  <p className='text-slate-400 font-black text-xs uppercase'>
                    No messages yet
                  </p>
                </div>
              ) : (
                contactMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className='bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all'
                  >
                    <div className='flex justify-between items-start mb-4'>
                      <div>
                        <h4 className='font-black text-slate-800 uppercase text-sm'>
                          {msg.name}
                        </h4>
                        <p className='text-indigo-500 text-[10px] font-bold'>
                          {msg.email}
                        </p>
                      </div>
                      <span className='text-[9px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-lg'>
                        {msg.date}
                      </span>
                    </div>
                    <p className='text-slate-600 text-sm leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic'>
                      "{msg.message}"
                    </p>
                    <div className='mt-6 flex gap-3'>
                      {/* <a
                        href={`mailto:${msg.email}`}
                        className='text-[9px] font-black bg-slate-900 text-white px-6 py-3 rounded-xl uppercase hover:bg-rose-500 transition-all'
                      >
                        Reply via Email
                      </a> */}
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className='text-[9px] font-black border-2 border-slate-100 text-slate-400 px-6 py-3 rounded-xl uppercase hover:text-rose-500 hover:border-rose-100 transition-all'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
