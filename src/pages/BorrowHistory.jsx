import React, { useEffect, useState } from "react";
import { API_URL, authHeaders } from "../api";

export default function BorrowHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/history`, {
          headers: authHeaders(),
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
      <h3 className='text-base font-black text-slate-800 uppercase italic mb-6'>
        Past Reads
      </h3>
      {history.length === 0 ? (
        <p className='text-slate-800 text-base italic'>
          No finished books yet. Keep reading!
        </p>
      ) : (
        <>
          {/* Phones: one card per book */}
          <ul className='sm:hidden space-y-3'>
            {history.map((item, index) => (
              <li
                key={index}
                className='bg-white rounded-2xl border border-slate-300 p-4'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-lg font-black text-slate-900 break-words'>
                      {item.title}
                    </p>
                    {item.author && (
                      <p className='text-sm font-bold italic text-slate-700'>
                        by {item.author}
                      </p>
                    )}
                  </div>
                  <span className='shrink-0 text-sm font-black bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md uppercase'>
                    Returned
                  </span>
                </div>
                <dl className='mt-3 grid grid-cols-2 gap-2 text-sm'>
                  <div>
                    <dt className='font-black uppercase text-slate-700'>Borrowed</dt>
                    <dd className='font-bold text-slate-900'>{item.borrow_date}</dd>
                  </div>
                  <div>
                    <dt className='font-black uppercase text-slate-700'>Returned</dt>
                    <dd className='font-bold text-slate-900'>{item.return_date}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          {/* Tablets and up: table */}
          <div className='hidden sm:block overflow-x-auto rounded-2xl border border-slate-300'>
            <table className='w-full text-left border-collapse'>
              <thead className='bg-white text-sm uppercase font-black text-slate-800'>
                <tr>
                  <th className='p-4'>Book Title</th>
                  <th className='p-4 whitespace-nowrap'>Borrowed</th>
                  <th className='p-4 whitespace-nowrap'>Returned</th>
                  <th className='p-4'>Status</th>
                </tr>
              </thead>
              <tbody className='text-base font-bold text-slate-800'>
                {history.map((item, index) => (
                  <tr key={index} className='border-t border-slate-300'>
                    <td className='p-4'>{item.title}</td>
                    <td className='p-4 whitespace-nowrap'>{item.borrow_date}</td>
                    <td className='p-4 whitespace-nowrap'>{item.return_date}</td>
                    <td className='p-4'>
                      <span className='text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md uppercase'>
                        Returned
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
