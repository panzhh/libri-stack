import React, { useEffect, useState } from "react";
import { API_URL, authHeaders } from "../api";

const money = (n) => `$${Number(n).toFixed(2)}`;

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // order whose copies are being changed
  const [editCopies, setEditCopies] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const startEdit = (order) => {
    setEditingId(order.id);
    setEditCopies(order.copies);
  };

  const saveCopies = async (order) => {
    setBusyId(order.id);
    try {
      const response = await fetch(
        `${API_URL}/api/user/book-requests/${order.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ copies: editCopies }),
        },
      );
      const data = await response.json();
      if (!response.ok) return alert(data.error || "Could not update the order.");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data : o)));
      setEditingId(null);
    } catch {
      alert("Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteOrder = async (order) => {
    if (
      !window.confirm(
        `Delete order ${order.order_number || ""} for "${order.title}"?`,
      )
    )
      return;
    setBusyId(order.id);
    try {
      const response = await fetch(
        `${API_URL}/api/user/book-requests/${order.id}`,
        { method: "DELETE", headers: authHeaders() },
      );
      const data = await response.json();
      if (!response.ok) return alert(data.error || "Could not delete the order.");
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch {
      alert("Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  };

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
        <h3 className='text-base font-bold text-black '>
          My Orders
        </h3>
        <span className='bg-gb-box text-gb-darker px-3 py-1 rounded-full text-sm font-bold'>
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className='text-black text-base '>
          You haven't ordered any books yet. Use the Order Book button on a
          book in the catalog.
        </p>
      ) : (
        <ul className='space-y-3'>
          {orders.map((order) => (
            <li
              key={order.id}
              className='bg-white rounded-lg border border-gb-line p-4 sm:p-5'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  {order.order_number && (
                    <p className='text-sm font-bold text-gb-darker whitespace-nowrap'>
                      Order #{order.order_number}
                    </p>
                  )}
                  <p className='text-lg font-bold text-black break-words'>
                    {order.title}
                  </p>
                  {order.author && (
                    <p className='text-sm font-bold text-gb-muted'>
                      by {order.author}
                    </p>
                  )}
                </div>
              </div>

              <dl className='mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm'>
                <div>
                  <dt className='font-bold text-gb-muted'>Copies</dt>
                  <dd className='text-base font-bold text-black'>
                    {order.copies}
                  </dd>
                </div>
                <div>
                  <dt className='font-bold text-gb-muted'>
                    Language
                  </dt>
                  <dd className='text-base font-bold text-black break-words'>
                    {(order.language || "Any").replace("/", "/\u200b")}
                  </dd>
                </div>
                <div>
                  <dt className='font-bold text-gb-muted'>
                    Ordered
                  </dt>
                  <dd className='text-base font-bold text-black'>
                    {order.date}
                  </dd>
                </div>
                <div>
                  <dt className='font-bold text-gb-muted'>Total</dt>
                  <dd className='text-base font-bold text-gb-darker'>
                    {order.total_price != null
                      ? money(order.total_price)
                      : "—"}
                  </dd>
                </div>
              </dl>
              {order.unit_price != null && (
                <p className='text-sm text-gb-muted mt-1'>
                  {order.copies} × {money(order.unit_price)}
                </p>
              )}

              {order.notes && (
                <p className='text-base text-black mt-3'>
                  <span className='font-bold'>Your notes:</span> {order.notes}
                </p>
              )}
              {/* Members can change or delete an order until the library acts on it */}
              <p
                className={`mt-3 p-3 rounded-xl text-base font-bold ${
                  order.can_modify
                    ? "bg-gb-box border border-gb-line text-gb-darker"
                    : "bg-gb-tile border border-gb-line text-black"
                }`}
              >
                {order.can_modify
                  ? `Collected ${order.collection_date} at 8:00 PM ET. You can change or delete it until then.`
                  : "Locked: the library is processing this order."}
              </p>

              {order.can_modify &&
                (editingId === order.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveCopies(order);
                    }}
                    className='mt-4 flex flex-wrap items-end gap-3'
                  >
                    <label className='flex flex-col'>
                      <span className='text-sm font-bold text-gb-muted'>
                        Copies
                      </span>
                      <input
                        type='number'
                        required
                        min='1'
                        max='100'
                        step='1'
                        inputMode='numeric'
                        value={editCopies}
                        onChange={(e) => setEditCopies(e.target.value)}
                        className='w-28 px-3 py-2 bg-white border-2 border-[#9fb3bd] text-black rounded-xl text-lg font-normal outline-none focus:border-gb-dark'
                      />
                    </label>
                    <button
                      type='submit'
                      disabled={busyId === order.id}
                      className='px-5 py-3 bg-gb-dark text-white rounded-xl text-sm font-bold hover:bg-gb-darker disabled:bg-slate-500'
                    >
                      Save
                    </button>
                    <button
                      type='button'
                      onClick={() => setEditingId(null)}
                      className='px-5 py-3 bg-white border-2 border-gb-line text-black rounded-xl text-sm font-bold '
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className='mt-4 flex flex-wrap gap-3'>
                    <button
                      onClick={() => startEdit(order)}
                      disabled={busyId === order.id}
                      className='px-5 py-3 bg-white border-2 border-gb-dark text-black rounded-xl text-sm font-bold hover:bg-gb-dark hover:text-white transition-colors'
                    >
                      Change copies
                    </button>
                    <button
                      onClick={() => deleteOrder(order)}
                      disabled={busyId === order.id}
                      className='px-5 py-3 bg-white border-2 border-rose-700 text-rose-700 rounded-xl text-sm font-bold hover:bg-rose-700 hover:text-white transition-colors'
                    >
                      Delete
                    </button>
                  </div>
                ))}

              {order.admin_note && (
                <p className='text-base text-black mt-2 bg-gb-box border border-gb-line p-3 rounded-xl'>
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
