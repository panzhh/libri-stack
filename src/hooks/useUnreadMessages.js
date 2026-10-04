import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_URL, authHeaders } from "../api";

// Number of unread messages for the logged-in member. Refreshed on every page
// change, when the Messages page reports a change, and every minute.
export default function useUnreadMessages() {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!token) return;
    const refresh = () =>
      fetch(`${API_URL}/api/messages/unread-count`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : { unread: 0 }))
        .then((d) => setUnread(d.unread || 0))
        .catch(() => {});
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("messages-changed", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("messages-changed", refresh);
    };
  }, [token, location.pathname]);

  return token ? unread : 0;
}
