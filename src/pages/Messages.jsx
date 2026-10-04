import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL, authHeaders } from "../api";

const SUBJECT_MAX = 200;
const BODY_MAX = 5000;

const formatDate = (iso) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

// Tell the Navbar to refresh its unread count
const announceChange = () =>
  window.dispatchEvent(new Event("messages-changed"));

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || data.msg || "Something went wrong.");
  return data;
};

// Search registered members by name and pick one
function RecipientPicker({ recipient, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(
          await request(`/api/members/search?q=${encodeURIComponent(q)}`),
        );
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (recipient) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="gb-tile px-4 py-2 text-lg font-bold">
          {recipient.name}
          {recipient.email_hint && (
            <span className="font-normal text-gb-muted">
              {" "}
              ({recipient.email_hint})
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="gb-link text-base"
        >
          Change
        </button>
      </div>
    );
  }

  const q = query.trim();
  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a member's name"
        aria-label="Search members by name"
        className="gb-input"
        autoComplete="off"
      />
      {q.length >= 2 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border-2 border-gb-line rounded-md shadow-sm max-h-72 overflow-y-auto">
          {results.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(member);
                  setQuery("");
                }}
                className="w-full text-left px-4 py-3 hover:bg-gb-tile"
              >
                <span className="font-bold">{member.name}</span>{" "}
                <span className="text-gb-muted">({member.email_hint})</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-4 py-3 text-gb-muted">
              {searching ? "Searching..." : "No members found with that name."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Compose({ draft, onSent, onCancel }) {
  const [recipient, setRecipient] = useState(draft.recipient || null);
  const [subject, setSubject] = useState(draft.subject || "");
  const [body, setBody] = useState(draft.body || "");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!recipient)
      return setError("Please choose who to send the message to.");
    setSending(true);
    setError("");
    try {
      await request("/api/messages", {
        method: "POST",
        body: JSON.stringify({ recipient_id: recipient.id, subject, body }),
      });
      onSent(recipient.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} className="space-y-5">
      {error && (
        <p
          role="alert"
          className="p-4 rounded-lg border-2 border-gb-red text-gb-red font-bold"
        >
          {error}
        </p>
      )}
      <div>
        <label className="gb-label">To</label>
        <RecipientPicker recipient={recipient} onChange={setRecipient} />
      </div>
      <div>
        <label className="gb-label" htmlFor="message-subject">
          Subject
        </label>
        <input
          id="message-subject"
          type="text"
          required
          maxLength={SUBJECT_MAX}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="gb-input"
        />
      </div>
      <div>
        <label className="gb-label" htmlFor="message-body">
          Message
        </label>
        <textarea
          id="message-body"
          required
          rows={8}
          maxLength={BODY_MAX}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="gb-input resize-y"
        />
        <p className="text-sm text-gb-muted text-right">
          {body.length} / {BODY_MAX}
        </p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <button type="submit" disabled={sending} className="gb-btn">
          {sending ? "Sending..." : "Send"}
        </button>
        <button type="button" onClick={onCancel} className="gb-btn-light">
          Cancel
        </button>
      </div>
    </form>
  );
}

function MessageView({ id, box, onBack, onReply, onDeleted }) {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    request(`/api/messages/${id}`)
      .then((data) => {
        setMessage(data);
        announceChange(); // opening it may have marked it read
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const remove = async () => {
    if (!window.confirm("Delete this message from your mailbox?")) return;
    try {
      await request(`/api/messages/${id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      alert(err.message);
    }
  };

  if (error) return <p className="text-gb-red font-bold">{error}</p>;
  if (!message) return <p className="animate-pulse">Loading message...</p>;

  return (
    <article className="space-y-5">
      <button onClick={onBack} className="gb-link text-base">
        ← Back to {box === "sent" ? "Sent" : "Inbox"}
      </button>
      <h2 className="gb-h2 break-words">{message.subject}</h2>
      <dl className="text-base grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="font-bold">From</dt>
        <dd>{message.sender.name}</dd>
        <dt className="font-bold">To</dt>
        <dd>{message.recipient.name}</dd>
        <dt className="font-bold">Date</dt>
        <dd>{formatDate(message.sent_at)}</dd>
      </dl>
      <div className="border-t border-gb-line pt-5 text-lg whitespace-pre-wrap break-words">
        {message.body}
      </div>
      <div className="flex gap-3 flex-wrap pt-2">
        {box === "inbox" && (
          <button onClick={() => onReply(message)} className="gb-btn">
            Reply
          </button>
        )}
        <button onClick={remove} className="gb-btn-danger">
          Delete
        </button>
      </div>
    </article>
  );
}

function MessageList({ box, messages, onOpen }) {
  if (messages.length === 0) {
    return (
      <p className="py-12 text-center text-lg text-gb-muted">
        {box === "sent"
          ? "You haven't sent any messages yet."
          : "Your inbox is empty."}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-gb-line border-y border-gb-line">
      {messages.map((m) => {
        const unread = box === "inbox" && !m.read;
        const who = box === "sent" ? `To: ${m.recipient.name}` : m.sender.name;
        return (
          <li key={m.id}>
            <button
              onClick={() => onOpen(m.id)}
              className={`w-full text-left px-3 py-4 hover:bg-gb-tile flex flex-col sm:flex-row sm:items-baseline gap-x-4 gap-y-1 ${
                unread ? "bg-gb-box" : ""
              }`}
            >
              <span
                className={`sm:w-48 shrink-0 truncate ${unread ? "font-bold" : ""}`}
              >
                {unread && (
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full bg-gb-red mr-2"
                    aria-label="Unread"
                  />
                )}
                {who}
              </span>
              <span className="flex-1 min-w-0 truncate">
                <span className={unread ? "font-bold" : ""}>{m.subject}</span>
                <span className="text-gb-muted"> — {m.preview}</span>
              </span>
              <span className="text-sm text-gb-muted shrink-0">
                {formatDate(m.sent_at)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function Messages() {
  const loggedIn = Boolean(localStorage.getItem("token"));
  const [box, setBox] = useState("inbox"); // "inbox", "sent" or "compose"
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (box === "compose") return;
    setLoading(true);
    setError("");
    try {
      setMessages(await request(`/api/messages?box=${box}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [box]);

  useEffect(() => {
    if (loggedIn) load();
  }, [load, loggedIn]);

  if (!loggedIn) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="gb-h1 mb-4">Messages</h1>
        <p className="text-lg">
          Please{" "}
          <Link to="/login" className="gb-link">
            log in
          </Link>{" "}
          to read and send messages.
        </p>
      </div>
    );
  }

  const switchTo = (next, nextDraft = {}) => {
    setBox(next);
    setOpenId(null);
    setDraft(nextDraft);
    setNotice("");
  };

  const reply = (message) =>
    switchTo("compose", {
      recipient: { id: message.sender.id, name: message.sender.name },
      subject: /^re:/i.test(message.subject)
        ? message.subject
        : `Re: ${message.subject}`.slice(0, SUBJECT_MAX),
      body: `\n\n--- On ${formatDate(message.sent_at)}, ${message.sender.name} wrote:\n${message.body
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")}`.slice(0, BODY_MAX),
    });

  const unread = box === "inbox" ? messages.filter((m) => !m.read).length : 0;
  const tabs = [
    ["inbox", "Inbox"],
    ["sent", "Sent"],
    ["compose", "New message"],
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="gb-h1 mb-6">Messages</h1>

      <div className="flex gap-2 flex-wrap mb-6" role="tablist">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={box === key}
            onClick={() => switchTo(key)}
            className={box === key ? "gb-btn" : "gb-btn-light"}
          >
            {label}
            {key === "inbox" && box === "inbox" && unread > 0 && ` (${unread})`}
          </button>
        ))}
      </div>

      {notice && (
        <p className="mb-6 p-4 rounded-lg border-2 border-gb-dark text-gb-darker font-bold">
          {notice}
        </p>
      )}

      <section className="bg-white border border-gb-line rounded-xl p-4 sm:p-8">
        {box === "compose" ? (
          <Compose
            key={JSON.stringify(draft)}
            draft={draft}
            onCancel={() => switchTo("inbox")}
            onSent={(name) => {
              switchTo("sent");
              setNotice(`✨ Message sent to ${name}.`);
            }}
          />
        ) : openId ? (
          <MessageView
            id={openId}
            box={box}
            onBack={() => {
              setOpenId(null);
              load();
            }}
            onReply={reply}
            onDeleted={() => {
              setOpenId(null);
              setNotice("Message deleted.");
              load();
              announceChange();
            }}
          />
        ) : loading ? (
          <p className="animate-pulse">Loading messages...</p>
        ) : error ? (
          <p className="text-gb-red font-bold">{error}</p>
        ) : (
          <MessageList
            box={box}
            messages={messages}
            onOpen={(id) => {
              setNotice("");
              setOpenId(id);
              // Opening marks it read, so the tab count updates right away
              setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, read: true } : m)),
              );
            }}
          />
        )}
      </section>
    </div>
  );
}
