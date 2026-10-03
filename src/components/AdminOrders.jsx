import React, { useEffect, useMemo, useState } from "react";
import { API_URL, authHeaders } from "../api";
import { STATUS_LABELS, STATUS_STYLES } from "../utils/requestStatus";

const STATUSES = Object.keys(STATUS_LABELS);
// Sort options for the table (and the CSV, which follows the table)
const byText = (key) => (a, b) =>
  (a[key] || "").localeCompare(b[key] || "", undefined, {
    sensitivity: "base",
  });
const byTime = (a, b) => new Date(a.ordered_at) - new Date(b.ordered_at);
const SORTS = {
  newest: {
    label: "Order time (newest first)",
    compare: (a, b) => byTime(b, a),
  },
  oldest: { label: "Order time (oldest first)", compare: byTime },
  title: { label: "Book title (A–Z)", compare: byText("title") },
  member: { label: "Member name (A–Z)", compare: byText("requested_by") },
  total: {
    label: "Total (highest first)",
    compare: (a, b) => (b.total_price ?? -1) - (a.total_price ?? -1),
  },
  copies: {
    label: "Copies (most first)",
    compare: (a, b) => (Number(b.copies) || 0) - (Number(a.copies) || 0),
  },
};

const money = (n) => (n == null ? "—" : `$${Number(n).toFixed(2)}`);

// One row per order, for the CSV download
const CSV_COLUMNS = [
  ["Order time (ET)", (o) => o.ordered_at_display],
  ["Order number", (o) => o.order_number],
  ["Book", (o) => o.title],
  ["Author", (o) => o.author],
  ["Language", (o) => o.language || "Any"],
  ["Copies", (o) => o.copies],
  ["Price per copy", (o) => o.unit_price ?? ""],
  ["Total", (o) => o.total_price ?? ""],
  ["Member", (o) => o.requested_by],
  ["Email", (o) => o.requester_email],
  ["Notes", (o) => o.notes],
  ["Collection", (o) => o.collection_date],
  ["Status", (o) => STATUS_LABELS[o.status] || o.status],
  ["Library note", (o) => o.admin_note],
];

const toCsv = (orders) => {
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [CSV_COLUMNS.map(([h]) => cell(h)).join(",")];
  orders.forEach((o) =>
    lines.push(CSV_COLUMNS.map(([, get]) => cell(get(o))).join(",")),
  );
  return "﻿" + lines.join("\r\n"); // BOM so Excel reads Chinese/Korean titles correctly
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState("next"); // "next", "all" or a date
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState({}); // unsaved library notes by order id

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/book-requests`, {
          headers: authHeaders(),
        });
        if (response.ok) setOrders(await response.json());
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateOrder = async (id, changes) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/book-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(changes),
      });
      const data = await response.json();
      if (!response.ok) return alert(data.error || "Update failed");
      setOrders((prev) => prev.map((o) => (o.id === id ? data : o)));
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      alert("Could not reach the server.");
    }
  };

  // Collections, soonest first; "next" is the earliest one that hasn't happened yet
  const collections = useMemo(() => {
    const byDate = new Map(
      orders.map((o) => [o.collection_at, o.collection_date]),
    );
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [orders]);
  const nextCollection = collections.find(
    ([at]) => new Date(at) > new Date(),
  )?.[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const wanted = collection === "next" ? nextCollection : collection;
    return orders
      .filter(
        (o) =>
          (collection === "all" || o.collection_at === wanted) &&
          (status === "all" || o.status === status) &&
          (!q ||
            [
              o.title,
              o.author,
              o.order_number,
              o.requested_by,
              o.requester_email,
            ]
              .filter(Boolean)
              .some((v) => v.toLowerCase().includes(q))),
      )
      .sort(SORTS[sortBy].compare);
  }, [orders, collection, nextCollection, status, search, sortBy]);

  const totals = filtered.reduce(
    (t, o) => ({
      copies: t.copies + (Number(o.copies) || 0),
      amount: t.amount + (Number(o.total_price) || 0),
    }),
    { copies: 0, amount: 0 },
  );

  const downloadCsv = () => {
    const blob = new Blob([toCsv(filtered)], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `book-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading)
    return <p className="p-10 text-center animate-pulse">Loading orders...</p>;

  const selectClass =
    "gb-input w-auto py-2 text-base";
  const labelClass =
    "gb-label text-sm";

  return (
    <section className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 bg-white border border-gb-line rounded-xl p-5">
        <div>
          <label className={labelClass}>Collection</label>
          <select
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className={selectClass}
          >
            <option value="next">Next collection</option>
            <option value="all">All collections</option>
            {collections.map(([at, label]) => (
              <option key={at} value={at}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={selectClass}
          >
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className={labelClass}>Search</label>
          <input
            type="text"
            placeholder="Title, order number or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${selectClass} w-full`}
          />
        </div>
        <button
          onClick={downloadCsv}
          disabled={filtered.length === 0}
          className="px-5 py-2.5 bg-gb-dark text-white rounded-xl text-sm font-bold hover:bg-gb-dark disabled:bg-slate-400"
        >
          Download CSV
        </button>
      </div>

      {/* Summary */}
      <p className="text-lg font-bold text-black">
        {filtered.length} {filtered.length === 1 ? "order" : "orders"} ·{" "}
        {totals.copies} {totals.copies === 1 ? "copy" : "copies"} · Total{" "}
        {money(totals.amount)}
        {collection === "next" && !nextCollection && (
          <span className="font-bold text-gb-muted">
            {" "}
            (no upcoming collection yet)
          </span>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border-2 border-dashed border-gb-line">
          <p className="text-black font-bold text-base ">
            No orders match these filters
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gb-line rounded-lg">
          <table className="w-full text-left text-sm border-collapse min-w-[1100px]">
            <thead className="bg-white text-xs font-bold text-black">
              <tr>
                {[
                  "Order time (ET)",
                  "Order #",
                  "Book",
                  "Language",
                  "Copies",
                  "Price",
                  "Total",
                  "Member",
                  "Notes",
                  "Collection",
                  "Status",
                  "Library note",
                ].map((h) => (
                  <th key={h} className="p-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-black">
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-gb-line align-top">
                  <td className="p-3 whitespace-nowrap">
                    {o.ordered_at_display}
                  </td>
                  <td className="p-3 whitespace-nowrap font-bold text-gb-darker">
                    {o.order_number}
                  </td>
                  <td className="p-3 min-w-[180px]">
                    <p className="font-bold">{o.title}</p>
                    {o.author && (
                      <p className="text-gb-muted">by {o.author}</p>
                    )}
                  </td>
                  <td className="p-3">{o.language || "Any"}</td>
                  <td className="p-3 font-bold text-base">{o.copies}</td>
                  <td className="p-3 whitespace-nowrap">
                    {money(o.unit_price)}
                  </td>
                  <td className="p-3 whitespace-nowrap font-bold text-gb-darker">
                    {money(o.total_price)}
                  </td>
                  <td className="p-3 min-w-[200px]">
                    <p className="font-bold">{o.requested_by}</p>
                    <p className="text-gb-muted whitespace-nowrap">
                      {o.requester_email}
                    </p>
                  </td>
                  <td className="p-3 min-w-[140px] ">{o.notes || "—"}</td>
                  <td className="p-3 whitespace-nowrap">{o.collection_date}</td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) =>
                        updateOrder(o.id, { status: e.target.value })
                      }
                      className={`px-2 py-1 rounded-lg border-2 text-xs font-normal  cursor-pointer outline-none ${STATUS_STYLES[o.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 min-w-[200px]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Expected next month"
                        value={notes[o.id] ?? o.admin_note ?? ""}
                        onChange={(e) =>
                          setNotes({ ...notes, [o.id]: e.target.value })
                        }
                        className="flex-1 min-w-0 px-2 py-1 bg-white border-2 border-[#9fb3bd] rounded-lg text-sm outline-none focus:border-gb-dark"
                      />
                      <button
                        disabled={notes[o.id] === undefined}
                        onClick={() =>
                          updateOrder(o.id, { admin_note: notes[o.id] })
                        }
                        className="px-3 py-1 bg-gb-dark text-white rounded-lg text-xs font-bold disabled:opacity-30"
                      >
                        Save
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
