// Base URL of the Flask backend. In development the API runs on its own port;
// in production Flask serves this site too, so requests go to the same origin.
export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:5000" : "");

// Authorization header for routes protected with @jwt_required
export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
