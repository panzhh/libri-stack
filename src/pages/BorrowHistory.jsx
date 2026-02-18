import React, { useEffect, useState } from "react";

export default function BorrowHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      try {
        const response = await fetch("http://localhost:5000/api/user/history", {
          headers: { Authorization: `Bearer ${userData.token}` },
        });

        if (response.status === 401) {
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem("user"); // Clear the expired token
          window.location.href = "/login"; // Send them to the login page
          return;
        }
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading)
    return <p className='p-10 text-center animate-pulse'>Loading history...</p>;

  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-black text-slate-800 uppercase italic mb-6'>
        Past Reads
      </h3>
      {history.length === 0 ? (
        <p className='text-slate-400 text-xs italic'>
          No finished books yet. Keep reading!
        </p>
      ) : (
        <div className='overflow-hidden rounded-2xl border border-slate-100'>
          <table className='w-full text-left border-collapse'>
            <thead className='bg-slate-50 text-[10px] uppercase font-black text-slate-400'>
              <tr>
                <th className='p-4'>Book Title</th>
                <th className='p-4'>Borrowed</th>
                <th className='p-4'>Returned</th>
                <th className='p-4'>Status</th>
              </tr>
            </thead>
            <tbody className='text-xs font-bold text-slate-600'>
              {history.map((item, index) => (
                <tr
                  key={index}
                  className='border-t border-slate-50 hover:bg-slate-50/50'
                >
                  <td className='p-4'>{item.title}</td>
                  <td className='p-4 text-slate-400'>{item.borrow_date}</td>
                  <td className='p-4 text-slate-400'>{item.return_date}</td>
                  <td className='p-4'>
                    <span className='text-[9px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md uppercase'>
                      Returned
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
