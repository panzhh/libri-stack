import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, authHeaders, coverUrl, showFallbackCover } from "../api";
import AdminOrders from "../components/AdminOrders";
import Messages from "./Messages";
import useUnreadMessages from "../hooks/useUnreadMessages";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // --- MOBILE UI STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- SEARCH / FILTER ---
  const [borrowSearch, setBorrowSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "borrowed", "returned"

  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("overview");
  const unreadMessages = useUnreadMessages();
  const [userSubTab, setUserSubTab] = useState("user");
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  // --- EMAIL SELECTION & SERVER STATE ---
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
  const [stockFilter, setStockFilter] = useState("All"); // "All", "In Stock", "Out of Stock"

  const [newBook, setNewBook] = useState({
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

  const [borrowRecords, setBorrowRecords] = useState([]);

  // --- FIELD DEFINITIONS ---
  const bookFields = [
    { label: "Title", key: "title", required: true },
    { label: "Author", key: "author", required: true },
    { label: "Series", key: "series" },
    { label: "Volume", key: "volume" },
    { label: "Publisher", key: "publisher" },
    { label: "Genre", key: "genre" },
    { label: "Language", key: "language" },
    { label: "ISBN", key: "isbn" },
    { label: "Price (USD)", key: "listPriceUsd" },
    { label: "Total Stock", key: "copies", type: "number" },
    { label: "Available Stock", key: "availableCopies", type: "number" },
    { label: "Pages", key: "numberOfPages", type: "number" },

    // --- UPDATED FIELD ---
    {
      label: "Book Cover Art",
      key: "uploadedImageUrl",
      isImage: true, // New flag for our logic
      fullWidth: true,
    },
    { label: "Summary", key: "summary", fullWidth: true, isTextArea: true },
  ];

  // --- FETCH: ADMIN PROFILE ---
  const fetchAdminProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAdminProfile(data);
      }
    } catch (err) {
      console.error("Error fetching admin profile:", err);
    }
  };

  // --- FETCH: BORROW RECORDS ---
  const fetchBorrowRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/borrow-records`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      setBorrowRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching borrow records:", err);
    }
  };

  // --- FETCH: SYSTEM DATA ---
  const fetchSystemData = async () => {
    try {
      const userRes = await fetch(`${API_URL}/api/debug/users`, {
        headers: authHeaders(),
      });
      const userData = await userRes.json();

      const bookRes = await fetch(`${API_URL}/api/books`);
      const bookData = await bookRes.json();

      setUsers(Array.isArray(userData) ? userData : []);
      setBooks(Array.isArray(bookData) ? bookData : []);
    } catch (err) {
      console.error("Dashboard sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- INITIAL LOAD (single useEffect) ---
  useEffect(() => {
    fetchAdminProfile();
    fetchSystemData();
    fetchBorrowRecords();
  }, []);

  // --- BORROW: RETURN BOOK ---
  const handleReturnBook = async (recordId) => {
    if (!window.confirm("Confirm this book has been returned?")) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/return-book/${recordId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        },
      );

      if (response.ok) {
        fetchBorrowRecords();
        fetchSystemData();
        alert("Success: Book marked as returned.");
      } else {
        alert("Failed to update record.");
      }
    } catch (err) {
      console.error("Error returning book:", err);
    }
  };

  // --- ADD BOOK ---
  const handleAddBookSubmit = async (e) => {
    e.preventDefault();

    // Keep listPriceUsd numeric; only format on UI if needed
    const payload = {
      ...newBook,
      availableCopies: newBook.copies,
      dateAdded: new Date().toISOString().split("T")[0],
    };

    try {
      const response = await fetch(`${API_URL}/api/admin/add-book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

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
        fetchSystemData();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData?.error || "Failed to add book.");
      }
    } catch (err) {
      console.error("Error saving book:", err);
      alert("Server error saving book.");
    }
  };

  // --- EMAIL SERVER LOGIC ---
  const toggleUserSelection = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const handleConfirmSendEmail = async (e) => {
    e.preventDefault();
    setIsSendingEmail(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          recipients: selectedEmails,
          subject: emailContent.subject,
          message: emailContent.body,
        }),
      });
      if (response.ok) {
        alert(`Success: Message sent to ${selectedEmails.length} users.`);
        setIsEmailModalOpen(false);
        setSelectedEmails([]);
        setEmailContent({ subject: "", body: "" });
      } else {
        alert("Failed to send email.");
      }
    } catch {
      alert("Server error sending email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // --- EDIT & DELETE LOGIC ---
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

    // 1. Create the "Envelope" (FormData)
    const formData = new FormData();

    // 2. Handle the numeric data cleaning (just like you had it)
    let cleanPrice = editFormData.listPriceUsd;
    if (cleanPrice !== undefined && cleanPrice !== "") {
      const cleanNumber = String(cleanPrice).replace(/[^\d.]/g, "");
      cleanPrice = cleanNumber === "" ? 0 : Number(cleanNumber);
    }

    // 3. Fill the envelope with your text fields
    // We loop through editFormData and skip the preview URL and the file itself
    Object.keys(editFormData).forEach((key) => {
      if (key === "listPriceUsd") {
        formData.append(key, cleanPrice);
      } else if (key !== "imageFile" && key !== "uploadedImageUrl") {
        formData.append(key, editFormData[key] ?? ""); // ?? keeps a stock of 0
      }
    });

    // 4. ADD THE IMAGE FILE
    // If the user picked a new file, we add it to the envelope
    if (editFormData.imageFile) {
      formData.append("coverImage", editFormData.imageFile);
    }

    formData.append("id", editFormData.id);

    try {
      const response = await fetch(`${API_URL}/api/books/${editFormData.id}`, {
        method: "PUT",
        headers: {
          // IMPORTANT: Remove "Content-Type".
          // The browser will automatically set it to "multipart/form-data" for you.
          ...authHeaders(),
        },
        body: formData, // Send the envelope, not a JSON string
      });

      if (response.ok) {
        alert("Success: Library records updated.");
        setIsEditing(false);
        // For the UI, we merge the cleaned price back in
        setSelectedBook({ ...editFormData, listPriceUsd: cleanPrice });
        fetchSystemData();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData?.error || "Failed to update book.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error updating book.");
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

    if (
      !window.confirm(
        `Permanently delete user ${email}? This cannot be undone.`,
      )
    )
      return;

    try {
      const response = await fetch(
        `${API_URL}/api/debug/delete-user?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        },
      );
      if (response.ok) {
        fetchSystemData();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || data.msg || "Failed to delete user.");
      }
    } catch {
      alert("Error deleting user.");
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;


    try {
      const response = await fetch(
        `${API_URL}/api/admin/delete-book/${bookId}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        alert("Book removed from registry.");
        fetchSystemData();
      } else {
        alert(`Error: ${data.error || "Failed to delete book"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error while deleting book.");
    }
  };

  const handlePromoteUser = async (userId, name) => {
    const confirmPromote = window.confirm(
      `Are you sure you want to promote ${name} to ADMIN? This gives them full access to LibriStack.`,
    );
    if (!confirmPromote) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/promote-user/${userId}`,
        {
          method: "PATCH",
          headers: {
            ...authHeaders(),
          },
        },
      );

      if (response.ok) {
        alert(`${name} is now an Admin.`);
        fetchSystemData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert("Failed to promote: " + (errorData.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Promotion error:", err);
      alert("Server error promoting user.");
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

  const filteredBorrowRecords = borrowRecords.filter((record) => {
    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;
    const matchesSearch =
      record.user_name?.toLowerCase().includes(borrowSearch.toLowerCase()) ||
      record.book_title?.toLowerCase().includes(borrowSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredInventory = books
    .filter((book) => {
      const matchesSearch =
        book.title?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        book.author?.toLowerCase().includes(inventorySearch.toLowerCase());

      const matchesLanguage =
        languageFilter === "All" || book.language === languageFilter;

      const matchesStock =
        stockFilter === "All" ||
        (stockFilter === "In Stock"
          ? Number(book.availableCopies) > 0
          : Number(book.availableCopies) === 0);

      return matchesSearch && matchesLanguage && matchesStock;
    }) // --- ADD THE SORT HERE ---
    .sort((a, b) => {
      // Numerical sort: lowest ID first
      return Number(a.id) - Number(b.id);

      // Use "return Number(b.id) - Number(a.id)" for newest/highest ID first
    });

  // --- NAV helper: close sidebar on mobile ---
  const goTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setIsSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gb-box flex items-center justify-center'>
        <div className='text-gb-muted font-bold text-xs '>
          Loading...
        </div>
      </div>
    );
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData({
        ...editFormData,
        imageFile: file, // This is the actual file data
        uploadedImageUrl: URL.createObjectURL(file), // This is just for the preview
      });
    }
  };

  return (
    <div className='min-h-screen bg-gb-box flex'>
      {/* Mobile menu button (bottom-right, same as the member dashboard) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        className='xl:hidden fixed bottom-6 right-6 z-[60] w-16 h-16 bg-gb-dark text-white rounded-full shadow-sm flex items-center justify-center text-3xl active:scale-95 transition-transform'
      >
        {isSidebarOpen ? "✕" : "☰"}
      </button>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className='xl:hidden fixed inset-0 z-50 bg-black/50'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed xl:sticky top-0 z-50 xl:z-auto
          h-screen overflow-y-auto
          bg-gb-box text-black border-r border-gb-line p-6 xl:p-8
          w-[85vw] max-w-xs xl:w-72 shrink-0
          transform transition-transform duration-200
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          xl:translate-x-0
        `}
      >
        {/* Close button for mobile */}
        <div className='xl:hidden flex justify-end mb-4'>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className='text-xl font-bold'
            aria-label='Close menu'
          >
            ✕
          </button>
        </div>

        <div className='mb-12'>
          <h1 className='font-serif text-2xl leading-tight'>
            Church in Dunn Loring{" "}
            Library
          </h1>
          <p className='text-gb-muted text-xs font-bold '>
            Control Panel
          </p>
        </div>

        <nav className='flex-1 space-y-6'>
          <div>
            <p className='text-gb-muted text-xs font-bold mb-4'>
              Main Menu
            </p>
            <ul className='space-y-2'>
              <li
                onClick={() => goTab("overview")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "overview"
                    ? "bg-gb-dark text-white border-gb-dark shadow-sm"
                    : "text-black hover:bg-gb-nav border-transparent"
                }`}
              >
                Dashboard Overview
              </li>
              <li
                onClick={() => goTab("users")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "users"
                    ? "bg-gb-dark text-white border-gb-dark shadow-sm"
                    : "text-black hover:bg-gb-nav border-transparent"
                }`}
              >
                User Management
              </li>
              <li
                onClick={() => goTab("inventory")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "inventory"
                    ? "bg-gb-dark text-white border-gb-dark shadow-sm"
                    : "text-black hover:bg-gb-nav border-transparent"
                }`}
              >
                Book Inventory
              </li>
              <li
                onClick={() => goTab("borrowed")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "borrowed"
                    ? "bg-gb-dark text-white border-gb-dark shadow-sm"
                    : "text-black hover:bg-gb-nav border-transparent"
                }`}
              >
                Borrowed Books
              </li>
              <li
                onClick={() => goTab("add-book")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "add-book"
                    ? "bg-gb-dark text-white border-gb-dark shadow-sm"
                    : "text-black hover:bg-gb-nav border-transparent"
                }`}
              >
                Add New Book
              </li>
              <li
                onClick={() => goTab("orders")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "orders"
                    ? "bg-gb-dark text-white border-gb-dark shadow-sm"
                    : "text-black hover:bg-gb-nav border-transparent"
                }`}
              >
                Order Books
              </li>
            </ul>
          </div>

          <div>
            <p className='text-gb-muted text-xs font-bold mb-4'>
              Personal
            </p>
            <ul className='space-y-2'>
              <li
                onClick={() => goTab("profile")}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "profile"
                    ? "bg-gb-dark text-white border-gb-dark shadow-sm "
                    : "text-black hover:bg-gb-nav border-transparent"
                }`}
              >
                My Profile
              </li>
              <li
                onClick={() => goTab("member-messages")}
                className={`flex items-center justify-between p-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                  activeTab === "member-messages"
                    ? "bg-gb-dark text-white border-gb-dark shadow-sm"
                    : "text-black hover:bg-gb-nav border-transparent"
                }`}
              >
                Messages
                {unreadMessages > 0 && (
                  <span
                    className='min-w-6 px-1.5 rounded-full bg-gb-red text-white text-sm text-center'
                    aria-label={`${unreadMessages} unread`}
                  >
                    {unreadMessages}
                  </span>
                )}
              </li>
            </ul>
          </div>
        </nav>

        <button
          onClick={handleLogout}
          className='gb-btn mt-6 hidden md:inline-flex'
        >
          Log out
        </button>
      </aside>

      {/* Main */}
      <main className='flex-1 overflow-y-auto p-4 md:p-12'>
        <header className='flex justify-between items-center mb-8 md:mb-12'>
          <h1 className='gb-h1'>
            {activeTab === "profile"
              ? "Admin Profile"
              : activeTab === "overview"
                ? "System Dashboard"
                : activeTab === "inventory"
                  ? "Book Inventory"
                  : activeTab === "borrowed"
                    ? "Borrowed Books"
                    : activeTab === "add-book"
                        ? "Add New Book"
                        : activeTab === "orders"
                          ? "Order Books"
                          : activeTab === "member-messages"
                            ? "Messages"
                            : "User Management"}
          </h1>
        </header>

        {/* USERS SEARCH */}
        {activeTab === "users" && (
          <div className='relative w-full max-w-md mb-6 md:mb-10'>
            <span className='absolute inset-y-0 left-4 flex items-center text-black'>
              🔍
            </span>
            <input
              type='text'
              placeholder='Search records...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-11 pr-5 py-3 bg-white border border-[#9fb3bd] rounded-lg text-xs font-normal focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-sm'
            />
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 animate-in fade-in'>
            <div className='bg-white p-6 md:p-8 rounded-xl border border-gb-line shadow-sm'>
              <div className='w-12 h-12 bg-gb-box rounded-lg flex items-center justify-center text-2xl mb-6'>
                👥
              </div>
              <h3 className='text-black font-bold text-xs mb-1'>
                Total Members
              </h3>
              <p className='text-4xl font-bold text-black'>
                {users.length}
              </p>
            </div>
            <div className='bg-white p-6 md:p-8 rounded-xl border border-gb-line shadow-sm'>
              <div className='w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center text-2xl mb-6'>
                📖
              </div>
              <h3 className='text-black font-bold text-xs mb-1'>
                Books in Catalog
              </h3>
              <p className='text-4xl font-bold text-black'>
                {books.length}
              </p>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <section className='bg-white rounded-xl md:rounded-xl border border-gb-line shadow-sm p-5 md:p-10 animate-in fade-in'>
            <div className='flex flex-col md:flex-row md:flex-wrap md:justify-between md:items-center gap-4 mb-6 md:mb-10'>
              <h3 className='text-lg md:text-xl font-bold text-black '>
                Database Records
              </h3>

              <div className='flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center sm:justify-between'>
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold  transition-all ${
                    selectedEmails.length > 0
                      ? "bg-gb-dark text-white"
                      : "bg-gb-tile text-black"
                  }`}
                  disabled={selectedEmails.length === 0}
                >
                  Email Selected ({selectedEmails.length})
                </button>

                <div className='flex bg-white p-1.5 rounded-lg'>
                  <button
                    onClick={() => setUserSubTab("user")}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold  transition-all ${
                      userSubTab === "user"
                        ? "bg-white text-gb-darker shadow-sm"
                        : "text-gb-muted"
                    }`}
                  >
                    Members
                  </button>
                  <button
                    onClick={() => setUserSubTab("admin")}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold  transition-all ${
                      userSubTab === "admin"
                        ? "bg-white text-rose-700 shadow-sm"
                        : "text-gb-muted"
                    }`}
                  >
                    Admins
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile: cards */}
            <div className='md:hidden space-y-4'>
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className='border border-gb-line rounded-lg p-4 bg-white'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div
                        className='font-bold text-black truncate cursor-pointer'
                        onClick={() => setSelectedUser(u)}
                      >
                        {u.full_name}
                      </div>
                      <div className='text-xs text-gb-muted break-all'>
                        {u.email}
                      </div>
                      <div className='text-xs text-black font-bold mt-2'>
                        Joined: {u.registration_date || "Unknown"}
                      </div>
                    </div>

                    <input
                      type='checkbox'
                      className='mt-1'
                      checked={selectedEmails.includes(u.email)}
                      onChange={() => toggleUserSelection(u.email)}
                    />
                  </div>

                  <div className='flex gap-3 mt-4'>
                    {u.role === "user" && userSubTab === "user" && (
                      <button
                        onClick={() => handlePromoteUser(u.id, u.full_name)}
                        className='flex-1 py-2 rounded-xl bg-gb-dark text-white text-xs font-bold '
                      >
                        Promote
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(u.email)}
                      className='flex-1 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className='hidden md:block'>
              <table className='w-full text-left'>
                <thead>
                  <tr className='text-xs font-bold text-black border-b '>
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
                      className='border-b border-gb-line hover:bg-gb-tile transition-colors'
                    >
                      <td className='py-5'>
                        <input
                          type='checkbox'
                          checked={selectedEmails.includes(u.email)}
                          onChange={() => toggleUserSelection(u.email)}
                        />
                      </td>
                      <td
                        className='py-5 font-bold text-black text-sm cursor-pointer hover:text-gb-darker hover:underline transition-all'
                        onClick={() => setSelectedUser(u)}
                      >
                        {u.full_name}
                      </td>
                      <td className='py-5 text-sm text-gb-muted'>{u.email}</td>
                      <td className='py-5 text-xs font-bold text-black '>
                        {u.registration_date || "Unknown"}
                      </td>
                      <td className='py-5 text-right'>
                        <div className='flex justify-end gap-4'>
                          {u.role === "user" && userSubTab === "user" && (
                            <button
                              onClick={() =>
                                handlePromoteUser(u.id, u.full_name)
                              }
                              className='text-xs font-bold text-gb-darker hover:underline'
                            >
                              Promote
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.email)}
                            className='text-xs font-bold text-rose-700 hover:underline'
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className='animate-in fade-in'>
            <div className='flex flex-wrap items-center gap-4 mb-6 md:mb-10 bg-white p-5 md:p-6 rounded-xl border border-gb-line shadow-sm'>
              <div className='relative flex-1 min-w-[240px]'>
                <span className='absolute inset-y-0 left-4 flex items-center text-black'>
                  🔍
                </span>
                <input
                  type='text'
                  placeholder='Search title or author...'
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className='w-full pl-11 pr-5 py-3 bg-gb-tile border border-[#9fb3bd] rounded-lg text-xs font-normal focus:outline-none focus:ring-2 focus:ring-rose-500/20'
                />
              </div>

              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className='px-4 py-3 bg-gb-tile border border-[#9fb3bd] rounded-lg text-xs font-normal text-gb-muted focus:outline-none'
              >
                <option value='All'>All Languages</option>
                <option value='Burmese'>Burmese</option>
                <option value='Chinese'>Chinese</option>
                <option value='Chinese/simplified'>Chinese/simplified</option>
                <option value='Chinese/traditional'>Chinese/traditional</option>
                <option value='English'>English</option>
                <option value='French'>French</option>
                <option value='German'>German</option>
                <option value='Japanese'>Japanese</option>
                <option value='Korean'>Korean</option>
                <option value='Malaysian'>Malaysian</option>
                <option value='Portuguese'>Portuguese</option>
                <option value='Russian'>Russian</option>
                <option value='Spanish'>Spanish</option>
                <option value='Tagalog'>Tagalog</option>
              </select>

              <div className='flex bg-white p-1 rounded-lg'>
                {["All", "In Stock", "Out of Stock"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStockFilter(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold  transition-all ${
                      stockFilter === s
                        ? "bg-white text-rose-700 shadow-sm"
                        : "text-gb-muted hover:text-gb-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8'>
              {filteredInventory.map((book) => (
                <div
                  key={book.id}
                  className='bg-white p-6 rounded-xl border border-gb-line shadow-sm hover:shadow-sm transition-all group'
                >
                  <div className='aspect-square bg-gb-box rounded-xl mb-4 flex items-center justify-center text-5xl border border-gb-line overflow-hidden relative'>
                    {book.uploadedImageUrl ? (
                      <img
                        src={`${API_URL}/api/covers/${book.id}.png`}
                        className='w-full h-full object-cover'
                        alt=''
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "book-icon.png";
                          e.target.className =
                            "w-full h-full object-contain p-8 opacity-20";
                        }}
                      />
                    ) : (
                      "📖"
                    )}

                    <div
                      className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold  ${
                        Number(book.availableCopies) > 0
                          ? "bg-emerald-700 text-white"
                          : "bg-gb-red text-white"
                      }`}
                    >
                      {Number(book.availableCopies) > 0
                        ? `${book.availableCopies} Left`
                        : "Out of Stock"}
                    </div>
                  </div>

                  <h4 className='font-bold text-black truncate text-sm'>
                    {book.title}
                  </h4>
                  <p className='text-gb-muted text-xs font-bold mb-6'>
                    by {book.author || "Unknown"}
                  </p>

                  <div className='space-y-2'>
                    <button
                      onClick={() => setSelectedBook(book)}
                      className='w-full py-3 bg-gb-dark text-white rounded-xl text-xs font-bold hover:bg-gb-dark transition-all shadow-md'
                    >
                      View Details
                    </button>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => startEditing(book)}
                        className='flex-1 py-3 border-2 border-gb-line text-gb-muted rounded-xl text-xs font-bold hover:bg-gb-tile transition-all'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.id, book.title)}
                        className='px-4 py-3 border-2 border-gb-line text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredInventory.length === 0 && (
              <div className='py-20 text-center bg-white rounded-xl border-2 border-dashed border-gb-line'>
                <p className='text-black font-bold text-xs '>
                  No books match those filters
                </p>
              </div>
            )}
          </div>
        )}

        {/* BORROWED TAB (mobile cards + desktop table) */}
        {activeTab === "borrowed" && (
          <section className='bg-white rounded-xl md:rounded-xl border border-gb-line shadow-sm p-5 md:p-10 animate-in fade-in'>
            <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6 mb-6 md:mb-10'>
              <div>
                <p className='text-xs text-black font-bold mt-2'>
                  Monitoring {filteredBorrowRecords.length} Records
                </p>
              </div>

              <div className='flex flex-wrap items-center gap-4 w-full lg:w-auto'>
                <div className='relative flex-1 lg:w-64'>
                  <span className='absolute inset-y-0 left-4 flex items-center text-black text-xs'>
                    🔍
                  </span>
                  <input
                    type='text'
                    placeholder='Search borrower or book...'
                    value={borrowSearch}
                    onChange={(e) => setBorrowSearch(e.target.value)}
                    className='w-full pl-10 pr-4 py-2.5 bg-gb-tile border border-[#9fb3bd] rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-rose-500/20'
                  />
                </div>

                <div className='flex bg-white p-1 rounded-xl'>
                  {["all", "borrowed", "returned"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold  transition-all ${
                        statusFilter === s
                          ? "bg-white text-rose-700 shadow-sm"
                          : "text-gb-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile cards */}
            <div className='md:hidden space-y-4'>
              {filteredBorrowRecords.map((record) => {
                const isOverdue =
                  record.status === "borrowed" &&
                  new Date(record.due_date) < new Date();

                return (
                  <div
                    key={record.id}
                    className={`rounded-lg border p-4 ${
                      isOverdue
                        ? "border-rose-100 bg-rose-50/50"
                        : "border-gb-line bg-white"
                    }`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='font-bold text-black truncate'>
                          {record.book_title}
                        </div>
                        <div className='text-xs text-gb-muted truncate'>
                          Borrower: {record.user_name}
                        </div>
                        <div className='mt-2 text-xs text-gb-muted font-bold'>
                          Out: {record.borrow_date} · Due:{" "}
                          <span
                            className={
                              isOverdue ? "text-rose-700 font-bold" : ""
                            }
                          >
                            {record.due_date}
                          </span>{" "}
                          {isOverdue && <span className='ml-1'>⚠️ LATE</span>}
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold  h-fit ${
                          record.status === "borrowed"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>

                    <div className='mt-4 flex gap-3'>
                      {record.status === "borrowed" ? (
                        <button
                          onClick={() => handleReturnBook(record.id)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold  ${
                            isOverdue
                              ? "bg-rose-600 text-white"
                              : "bg-gb-dark text-white"
                          }`}
                        >
                          Return Book
                        </button>
                      ) : (
                        <div className='flex-1 text-xs text-black font-bold text-right'>
                          Returned: {record.return_date || "N/A"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full text-left'>
                <thead>
                  <tr className='text-xs font-bold text-black border-b '>
                    <th className='pb-4'>Borrower Details</th>
                    <th className='pb-4'>Book Information</th>
                    <th className='pb-4'>Timeline</th>
                    <th className='pb-4'>Status</th>
                    <th className='pb-4 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBorrowRecords.map((record) => {
                    const isOverdue =
                      record.status === "borrowed" &&
                      new Date(record.due_date) < new Date();

                    return (
                      <tr
                        key={record.id}
                        className={`border-b border-gb-line transition-colors group ${
                          isOverdue
                            ? "bg-rose-50/30 hover:bg-rose-50/60"
                            : "hover:bg-gb-tile"
                        }`}
                      >
                        <td className='py-5'>
                          <p className='font-bold text-black text-sm'>
                            {record.user_name}
                          </p>
                          <p className='text-xs text-gb-darker font-bold '>
                            User ID: #{record.user_id}
                          </p>
                        </td>

                        <td className='py-5'>
                          <p className='font-bold text-gb-muted text-xs truncate max-w-[200px]'>
                            {record.book_title}
                          </p>
                          <p className='text-xs text-black font-bold'>
                            Book ID: {record.book_id}
                          </p>
                        </td>

                        <td className='py-5'>
                          <div className='flex flex-col gap-1'>
                            <span className='text-xs font-bold text-gb-muted '>
                              Out: {record.borrow_date}
                            </span>
                            <span
                              className={`text-xs font-bold  flex items-center gap-1 ${
                                isOverdue ? "text-rose-700" : "text-black"
                              }`}
                            >
                              Due: {record.due_date}
                              {isOverdue && (
                                <span className='animate-pulse'>⚠️ LATE</span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className='py-5'>
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold  ${
                              record.status === "borrowed"
                                ? "bg-amber-100 text-amber-700 shadow-sm border border-amber-200"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>

                        <td className='py-5 text-right'>
                          {record.status === "borrowed" ? (
                            <button
                              onClick={() => handleReturnBook(record.id)}
                              className={`text-xs font-bold px-4 py-2 rounded-xl  transition-all transform hover:scale-105 active:scale-95 shadow-sm ${
                                isOverdue
                                  ? "bg-rose-600 text-white hover:bg-rose-700 "
                                  : "bg-gb-dark text-white hover:bg-gb-dark"
                              }`}
                            >
                              Return Book
                            </button>
                          ) : (
                            <div className='flex flex-col items-end'>
                              <span className='text-xs font-bold text-black '>
                                Archived
                              </span>
                              <span className='text-xs text-black '>
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

            {filteredBorrowRecords.length === 0 && (
              <div className='py-20 text-center'>
                <p className='text-black font-bold text-xs '>
                  No records found matching your filters
                </p>
              </div>
            )}
          </section>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && adminProfile && (
          <section className='bg-white rounded-xl md:rounded-xl border border-gb-line shadow-sm overflow-hidden animate-in fade-in'>
            <div className='bg-gb-dark p-6 md:p-12 text-white flex items-center gap-6 md:gap-8'>
              <div className='w-20 h-20 md:w-24 md:h-24 bg-gb-dark rounded-xl flex items-center justify-center text-3xl md:text-4xl font-bold shadow-sm '>
                {adminProfile.full_name?.charAt(0)}
              </div>
              <div>
                <h3 className='text-2xl md:text-3xl font-bold '>
                  {adminProfile.full_name}
                </h3>
                <p className='text-rose-400 font-bold text-xs mt-1'>
                  Authorized {adminProfile.role}
                </p>
              </div>
            </div>
            <div className='p-6 md:p-12'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12'>
                <div>
                  <p className='text-black text-xs font-bold mb-1'>
                    Email
                  </p>
                  <p className='font-bold text-black text-lg'>
                    {adminProfile.email}
                  </p>
                </div>
                <div>
                  <p className='text-black text-xs font-bold mb-1'>
                    Phone
                  </p>
                  <p className='font-bold text-black text-lg'>
                    {adminProfile.phone || "---"}
                  </p>
                </div>
                <div>
                  <p className='text-black text-xs font-bold mb-1'>
                    Invite Code
                  </p>
                  <p className='font-bold text-gb-darker text-3xl tabular-nums'>
                    {adminProfile.own_invite_code || "---"}
                  </p>
                </div>
                <div>
                  <p className='text-black text-xs font-bold mb-1'>
                    Registered
                  </p>
                  <p className='font-bold text-black text-lg'>
                    {adminProfile.registration_date
                      ? new Date(
                          adminProfile.registration_date,
                        ).toLocaleDateString()
                      : "---"}
                  </p>
                </div>
                <div>
                  <p className='text-black text-xs font-bold mb-1'>
                    Status
                  </p>
                  <p
                    className={`font-bold  text-xs ${
                      adminProfile.is_verified
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
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

        {/* VIEW BOOK MODAL */}
        {selectedBook && !isEditing && (
          <div className='fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in'>
            <div className='bg-white w-full max-w-2xl max-h-[85vh] rounded-xl shadow-sm overflow-hidden flex flex-col'>
              <div className='p-6 border-b-2 border-gb-line flex gap-5 items-start bg-gb-box'>
                <div className='w-24 h-32 shrink-0 bg-white rounded-lg shadow-md border-2 border-gb-line overflow-hidden flex items-center justify-center'>
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
                <div className='flex-1 min-w-0 flex justify-between items-start gap-4'>
                  <div className='min-w-0'>
                    <h2 className='text-2xl sm:text-3xl font-bold text-black leading-tight break-words'>
                      {selectedBook.title}
                    </h2>
                    <p className='text-gb-darker font-bold text-base mt-2'>
                      by {selectedBook.author}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    aria-label='Close'
                    className='w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-gb-dark text-white text-2xl font-bold'
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className='p-6 sm:p-8 overflow-y-auto bg-white flex-1'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5'>
                  {bookFields
                    // title/author/cover are in the header; skip empty fields
                    .filter(
                      (field) =>
                        !["title", "author"].includes(field.key) &&
                        !field.isImage &&
                        selectedBook[field.key] !== null &&
                        selectedBook[field.key] !== undefined &&
                        selectedBook[field.key] !== "",
                    )
                    .map((field) => {
                      let value = selectedBook[field.key];
                      if (field.key === "listPriceUsd")
                        value = `$${Number(value).toFixed(2)}`;
                      if (typeof value === "string")
                        value = value.replace(/^https?:\/\/(www\.)?/, "");
                      return (
                        <div
                          key={field.key}
                          className={`border-b-2 border-gb-line pb-3 ${
                            field.fullWidth ? "sm:col-span-2" : ""
                          }`}
                        >
                          <p className='text-sm font-bold text-black mb-1'>
                            {field.label}
                          </p>
                          <p className='text-lg font-bold text-black leading-relaxed break-words'>
                            {value}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className='p-5 sm:p-6 bg-gb-box border-t-2 border-gb-line flex justify-end gap-3'>
                <button
                  onClick={() => setSelectedBook(null)}
                  className='px-6 py-4 bg-white border-2 border-gb-line text-black rounded-lg text-base font-bold '
                >
                  Close
                </button>
                <button
                  onClick={() => startEditing(selectedBook)}
                  className='px-8 py-4 bg-gb-dark text-white rounded-lg text-base font-bold shadow-sm hover:bg-gb-dark transition-all'
                >
                  Edit Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT BOOK MODAL */}
        {isEditing && (
          <div className='fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in'>
            <form
              onSubmit={handleUpdateBook}
              className='bg-white w-full max-w-2xl max-h-[85vh] rounded-xl shadow-sm overflow-hidden flex flex-col'
            >
              <div className='p-6 sm:p-8 overflow-y-auto bg-white flex-1'>
                <h2 className='text-2xl sm:text-3xl font-bold text-black mb-6'>
                  Editing Full Record
                </h2>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5'>
                  {bookFields.map((field) => (
                    <div
                      key={field.key}
                      className={`${field.fullWidth ? "sm:col-span-2" : ""}`}
                    >
                      <label className='text-sm font-bold text-black mb-1 block ml-2'>
                        {field.label}
                      </label>

                      {field.key === "uploadedImageUrl" ? (
                        <div className='flex items-center gap-6 p-4 bg-gb-box border-2 border-gb-line rounded-lg'>
                          {/* Preview: Calculated from ID or the new local file */}
                          <div className='w-20 h-28 bg-white rounded-lg border-2 border-gb-line shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center'>
                            {editFormData.uploadedImageUrl ? (
                              <img
                                src={coverUrl(editFormData.id)}
                                className='w-full h-full object-cover'
                                alt=''
                                onError={showFallbackCover}
                              />
                            ) : (
                              <span className='text-5xl opacity-30'>📖</span>
                            )}
                          </div>

                          <div className='flex-1'>
                            <input
                              type='file'
                              accept='image/png, image/jpeg'
                              onChange={handleImageUpload}
                              className='text-sm font-bold text-black file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gb-dark file:text-white hover:file:bg-rose-600 cursor-pointer transition-all'
                            />
                            <p className='text-xs font-bold text-black mt-2 '>
                              Filename will be:{" "}
                              <span className='text-black'>
                                {editFormData.id}.png
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {field.isTextArea ? (
                            <textarea
                              name={field.key}
                              value={editFormData[field.key] ?? ""}
                              onChange={handleInputChange}
                              rows='4'
                              className='w-full bg-white border-2 border-[#9fb3bd] text-black p-4 rounded-lg text-lg font-medium outline-none focus:border-gb-dark transition-all'
                            />
                          ) : (
                            <input
                              type={field.type || "text"}
                              name={field.key}
                              value={
                                field.key === "listPriceUsd" &&
                                editFormData[field.key] !== undefined
                                  ? String(editFormData[field.key]).replace(
                                      /[^\d.]/g,
                                      "",
                                    )
                                  : (editFormData[field.key] ?? "")
                              }
                              onChange={handleInputChange}
                              className='w-full bg-white border-2 border-[#9fb3bd] text-black px-4 py-3 rounded-xl text-lg font-normal outline-none focus:border-gb-dark'
                              required={field.required}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className='p-5 sm:p-6 bg-gb-box border-t-2 border-gb-line flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => setIsEditing(false)}
                  className='px-6 py-4 bg-white border-2 border-gb-line text-black rounded-lg text-base font-bold '
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-8 py-4 bg-emerald-700 text-white rounded-lg text-base font-bold shadow-sm hover:bg-emerald-800 transition-all'
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* EMAIL MODAL */}
        {isEmailModalOpen && (
          <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in'>
            <form
              onSubmit={handleConfirmSendEmail}
              className='bg-white w-full max-w-2xl rounded-xl md:rounded-xl shadow-sm overflow-hidden'
            >
              <div className='p-6 md:p-8 bg-gb-dark text-white'>
                <h2 className='text-xl md:text-2xl font-bold '>
                  Server Mailer
                </h2>
                <p className='text-indigo-200 text-xs font-bold '>
                  Sending to {selectedEmails.length} Users
                </p>
              </div>
              <div className='p-6 md:p-10 space-y-6'>
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
                  className='w-full bg-gb-tile border-2 border-[#9fb3bd] p-4 rounded-lg text-sm font-normal outline-none'
                />
                <textarea
                  required
                  rows='6'
                  placeholder='Message body...'
                  value={emailContent.body}
                  onChange={(e) =>
                    setEmailContent({ ...emailContent, body: e.target.value })
                  }
                  className='w-full bg-gb-tile border-2 border-[#9fb3bd] p-4 rounded-lg text-sm outline-none resize-none'
                />
              </div>
              <div className='p-6 md:p-8 bg-gb-box border-t flex gap-4'>
                <button
                  type='button'
                  onClick={() => setIsEmailModalOpen(false)}
                  className='flex-1 py-4 font-bold text-xs'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isSendingEmail}
                  className='flex-[2] py-4 bg-gb-dark text-white rounded-lg font-bold text-xs disabled:opacity-60'
                >
                  {isSendingEmail ? "Sending..." : "Send via Server"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* USER DETAIL MODAL */}
        {selectedUser && (
          <div className='fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in'>
            <div className='bg-white w-full max-w-2xl rounded-xl md:rounded-xl shadow-sm overflow-hidden'>
              <div className='bg-gb-dark p-6 md:p-8 text-white flex justify-between items-center'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-gb-dark rounded-xl flex items-center justify-center font-bold'>
                    {selectedUser.full_name?.charAt(0)}
                  </div>
                  <h2 className='text-lg md:text-xl font-bold '>
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

              <div className='p-6 md:p-10 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8'>
                <div>
                  <p className='text-xs font-bold text-black mb-1'>
                    Email
                  </p>
                  <p className='font-bold text-black break-all'>
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-bold text-black mb-1'>
                    Role
                  </p>
                  <p className='font-bold text-gb-darker '>
                    {selectedUser.role}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-bold text-black mb-1'>
                    Phone
                  </p>
                  <p className='font-bold text-black'>
                    {selectedUser.phone || "---"}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-bold text-black mb-1'>
                    Invite Code
                  </p>
                  <p className='font-bold text-black'>
                    {selectedUser.own_invite_code || "---"}
                  </p>
                </div>
              </div>

              <div className='p-6 bg-gb-box text-right'>
                <button
                  onClick={() => setSelectedUser(null)}
                  className='px-6 py-2 bg-gb-dark text-white rounded-xl text-xs font-bold '
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD NEW BOOK TAB */}
        {activeTab === "add-book" && (
          <section className='bg-white rounded-xl md:rounded-xl border border-gb-line shadow-sm p-6 md:p-12 animate-in slide-in-from-bottom-6 duration-500'>
            <div className='max-w-5xl mx-auto'>
              <header className='mb-8 md:mb-12'>
                <h3 className='text-2xl md:text-3xl font-bold text-black leading-none'>
                  New Title
                </h3>
                <p className='text-xs text-black font-bold mt-3 '>
                  Database entry / Global Library System
                </p>
              </header>

              <form
                onSubmit={handleAddBookSubmit}
                className='grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12'
              >
                <div className='lg:col-span-2 space-y-8'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    <div className='sm:col-span-2'>
                      <label className='text-xs font-bold text-black ml-2'>
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
                        className='w-full mt-2 px-6 py-4 bg-gb-tile border border-[#9fb3bd] rounded-lg text-sm font-normal focus:ring-4 focus:ring-rose-500/5 outline-none transition-all'
                      />
                    </div>

                    <div>
                      <label className='text-xs font-bold text-black ml-2'>
                        Primary Author
                      </label>
                      <input
                        type='text'
                        required
                        value={newBook.author}
                        onChange={(e) =>
                          setNewBook({ ...newBook, author: e.target.value })
                        }
                        className='w-full mt-2 px-6 py-4 bg-gb-tile border border-[#9fb3bd] rounded-lg text-sm font-normal outline-none'
                      />
                    </div>

                    <div>
                      <label className='text-xs font-bold text-black ml-2'>
                        ISBN-13
                      </label>
                      <input
                        type='text'
                        value={newBook.isbn}
                        onChange={(e) =>
                          setNewBook({ ...newBook, isbn: e.target.value })
                        }
                        placeholder='978-...'
                        className='w-full mt-2 px-6 py-4 bg-gb-tile border border-[#9fb3bd] rounded-lg text-sm font-normal outline-none'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='text-xs font-bold text-black ml-2'>
                      Language <span className='text-rose-700'>*</span>
                    </label>
                    <select
                      required
                      value={newBook.language}
                      onChange={(e) =>
                        setNewBook({ ...newBook, language: e.target.value })
                      }
                      className='w-full mt-2 px-4 py-4 bg-white border border-[#9fb3bd] rounded-lg text-xs font-normal outline-none focus:ring-4 focus:ring-rose-500/5 transition-all cursor-pointer'
                    >
                      <option value=''>Select Language</option>
                      <option value='English'>English</option>
                      <option value='Chinese'>Chinese</option>
                      <option value='Malay'>Malay</option>
                      <option value='French'>French</option>
                    </select>
                  </div>

                  <div>
                    <label className='text-xs font-bold text-black ml-2'>
                      Book Summary
                    </label>
                    <textarea
                      rows='6'
                      value={newBook.summary}
                      onChange={(e) =>
                        setNewBook({ ...newBook, summary: e.target.value })
                      }
                      className='w-full mt-2 px-6 py-4 bg-gb-tile border border-[#9fb3bd] rounded-xl text-sm font-medium outline-none resize-none'
                    />
                  </div>
                </div>

                <div className='space-y-8 bg-gb-box p-6 md:p-10 rounded-xl md:rounded-xl border border-gb-line'>
                  <div>
                    <label className='text-xs font-bold text-black ml-2'>
                      Category / Genre
                    </label>
                    <input
                      type='text'
                      value={newBook.category}
                      onChange={(e) =>
                        setNewBook({ ...newBook, category: e.target.value })
                      }
                      placeholder='e.g. Hymns'
                      className='w-full mt-2 px-6 py-4 bg-white border border-[#9fb3bd] rounded-lg text-sm font-normal outline-none'
                    />
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='text-xs font-bold text-black ml-2'>
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
                            copies: parseInt(e.target.value || "1", 10),
                          })
                        }
                        className='w-full mt-2 px-6 py-4 bg-white border border-[#9fb3bd] rounded-lg text-sm font-normal outline-none'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-bold text-black ml-2'>
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
                            listPriceUsd: parseFloat(e.target.value || "0"),
                          })
                        }
                        className='w-full mt-2 px-6 py-4 bg-white border border-[#9fb3bd] rounded-lg text-sm font-normal outline-none'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='text-xs font-bold text-black ml-2'>
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
                      className='w-full mt-2 px-6 py-4 bg-white border border-[#9fb3bd] rounded-lg text-sm font-normal outline-none'
                    />
                  </div>

                  <button
                    type='submit'
                    className='w-full py-6 bg-gb-dark text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all shadow-sm active:scale-95'
                  >
                    Confirm & Save Entry
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "member-messages" && (
          <section className='bg-white border border-gb-line rounded-xl p-4 md:p-8'>
            <Messages showTitle={false} />
          </section>
        )}
      </main>
    </div>
  );
}
