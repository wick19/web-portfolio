import { useEffect, useId, useRef, useState } from "react";
import {
  askConcierge,
  getConciergeUrl,
  isConciergeConfigured,
} from "../../lib/conciergeApi";

const SUGGESTIONS = [
  "What does Ritwik ship at Sprouts.ai?",
  "Summarize his strongest AI / ML proof",
  "Where should I start on this site?",
];

const WELCOME =
  "Ask about Ritwik’s experience, projects, thesis, or how to reach him. For the full picture, please go through the website — Home, Projects, Thesis, Experience, and Contact.";

function MessageBubble({ role, content }) {
  return (
    <div
      className={
        role === "user" ? "concierge-msg concierge-msg-user" : "concierge-msg"
      }
    >
      <p>{content}</p>
    </div>
  );
}

export default function Concierge() {
  const titleId = useId();
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [lastSentAt, setLastSentAt] = useState(0);
  const configured = isConciergeConfigured();

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, messages, busy, error]);

  async function send(text) {
    const content = String(text || "").trim();
    if (!content || busy) return;

    if (!configured) {
      setError(
        "Concierge API is not connected yet. Set VITE_CONCIERGE_URL after deploying the Worker."
      );
      return;
    }

    const now = Date.now();
    if (now - lastSentAt < 2500) {
      setError("Slow down a second — short cooldown to protect the demo.");
      return;
    }

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    setLastSentAt(now);

    try {
      const { reply } = await askConcierge(next);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="concierge-root">
      {open ? (
        <section
          className="concierge-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <header className="concierge-header">
            <div>
              <p className="section-label">// Live demo</p>
              <h2 id={titleId}>Portfolio Concierge</h2>
            </div>
            <button
              type="button"
              className="concierge-icon-btn"
              aria-label="Close concierge"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <p className="concierge-lede">{WELCOME}</p>

          <div className="concierge-suggestions" aria-label="Suggested questions">
            {messages.length === 0
              ? SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="concierge-chip"
                    disabled={busy}
                    onClick={() => send(q)}
                  >
                    {q}
                  </button>
                ))
              : null}
          </div>

          <div className="concierge-thread" ref={listRef} aria-live="polite">
            {messages.length === 0 ? (
              <p className="concierge-empty">
                Start a quick conversation about Ritwik — his AI work, projects,
                research, or how to reach him.
                {!configured ? (
                  <>
                    {" "}
                    <span className="concierge-warn">
                      Endpoint not set ({getConciergeUrl() || "missing"}).
                    </span>
                  </>
                ) : null}
              </p>
            ) : (
              messages.map((m, i) => (
                <MessageBubble key={`${m.role}-${i}`} role={m.role} content={m.content} />
              ))
            )}
            {busy ? (
              <p className="concierge-typing" aria-hidden="true">
                Thinking…
              </p>
            ) : null}
            {error ? <p className="concierge-error">{error}</p> : null}
          </div>

          <form className="concierge-form" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="concierge-input">
              Ask the concierge
            </label>
            <input
              id="concierge-input"
              ref={inputRef}
              type="text"
              value={input}
              maxLength={800}
              disabled={busy}
              placeholder="Ask about Sprouts, projects, thesis…"
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn-primary concierge-send"
              disabled={busy || !input.trim()}
            >
              Send
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className={open ? "concierge-fab is-open" : "concierge-fab"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Ask AI"}
      </button>
    </div>
  );
}
