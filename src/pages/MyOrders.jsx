import React, { useEffect, useState } from "react";
import { API_URL, authHeaders } from "../api";
import { STATUS_STYLES } from "../utils/requestStatus";

const money = (n) => `$${Number(n).toFixed(2)}`;

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/book-requests`, {
          headers: authHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading)
    return <p className='p-10 text-center animate-pulse'>Loading orders...</p>;

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center mb-6'>
        <h3 className='text-base font-black text-slate-800 uppercase italic'>
          My Orders
        </h3>
        <span className='bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-black'>
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className='text-slate-800 text-base italic'>
          You haven't ordered any books yet. Use the Order Book button on a
          book in the catalog.
        </p>
      ) : (
        <ul className='space-y-3'>
          {orders.map((order) => (
            <li
              key={order.id}
              className='bg-white rounded-2xl border border-slate-300 p-4 sm:p-5'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-lg font-black text-slate-900 break-words'>
                    {order.title}
                  </p>
                  {order.author && (
                    <p className='text-sm font-bold italic text-slate-700'>
                      by {order.author}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 px-3 py-1 rounded-lg border text-sm font-black uppercase tracking-wider ${STATUS_STYLES[order.status]}`}
                >
                  {order.status}
                </span>
              </div>

              <dl className='mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm'>
                <div>
                  <dt className='font-black uppercase text-slate-700'>Copies</dt>
                  <dd className='text-base font-bold text-slate-900'>
                    {order.copies}
                  </dd>
                </div>
                <div>
                  <dt className='font-black uppercase text-slate-700'>
                    Language
                  </dt>
                  <dd className='text-base font-bold text-slate-900 break-words'>
                    {(order.language || "Any").replace("/", "/\u200b")}
                  </dd>
                </div>
                <div>
                  <dt className='font-black uppercase text-slate-700'>
                    Ordered
                  </dt>
                  <dd className='text-base font-bold text-slate-900'>
                    {order.date}
                  </dd>
                </div>
                <div>
                  <dt className='font-black uppercase text-slate-700'>Total</dt>
                  <dd className='text-base font-black text-blue-800'>
                    {order.total_price != null
                      ? money(order.total_price)
                      : "—"}
                  </dd>
                </div>
              </dl>
              {order.unit_price != null && (
                <p className='text-sm text-slate-700 mt-1'>
                  {order.copies} × {money(order.unit_price)}
                </p>
              )}

              {order.notes && (
                <p className='text-base text-slate-900 mt-3'>
                  <span className='font-bold'>Your notes:</span> {order.notes}
                </p>
              )}
              {order.admin_note && (
                <p className='text-base text-slate-900 mt-2 bg-indigo-50 border border-indigo-200 p-3 rounded-xl'>
                  <span className='font-bold'>From the library:</span>{" "}
                  {order.admin_note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
