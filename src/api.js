// Base URL of the Flask backend. In development the API runs on its own port;
// in production Flask serves this site too, so requests go to the same origin.
export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:5000" : "");

// Authorization header for routes protected with @jwt_required
export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Uploaded cover image for a book; pair with showFallbackCover as onError
export const coverUrl = (bookId) => `${API_URL}/api/covers/${bookId}.png`;

export const showFallbackCover = (e) => {
  e.target.onerror = null;
  e.target.src = "/book-icon.png";
  e.target.className = "w-full h-full object-contain p-2 opacity-40";
};
