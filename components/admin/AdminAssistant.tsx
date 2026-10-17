"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = [
  "What should I do today?",
  "Summarise the pipeline and flag anyone going cold.",
  "Draft a reply to the newest lead.",
  "Which invoices are late, and what should I say?",
];

export default function AdminAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10) }),
      });
      const json = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok || !json.reply) {
        setError(json.error ?? "The assistant did not respond.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: json.reply! }]);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel assistant-panel">
      <div className="panel-head">
        <h2 className="panel-title">Assistant</h2>
        <span className="dim" style={{ fontSize: ".68rem" }}>reads leads, invoices, projects</span>
      </div>

      <div className="assistant-scroll" ref={listRef}>
        {messages.length === 0 && (
          <div className="assistant-empty">
            <p className="dim" style={{ fontSize: ".8rem", lineHeight: 1.55 }}>
              Ask about the pipeline, draft a lead reply, or get a plan for the day. It
              has your last fifteen leads, open invoices and active projects — nothing
              from outside the admin.
            </p>
            <div className="assistant-quick">
              {QUICK.map((q) => (
                <button key={q} type="button" className="assistant-chip" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`assistant-msg assistant-msg--${m.role}`}>
            <div className="assistant-text">{m.content}</div>
          </div>
        ))}

        {busy && <p className="assistant-thinking dim">Thinking…</p>}
        {error && <p className="assistant-error">{error}</p>}
      </div>

      <form
        className="assistant-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about the business…"
          className="a-input"
          aria-label="Ask the assistant"
          maxLength={2000}
        />
        <button type="submit" className="a-btn a-btn--primary" disabled={busy || !input.trim()}>
          Ask
        </button>
      </form>

      <style>{`
        .assistant-panel { display: grid; grid-template-rows: auto 1fr auto; }
        .assistant-scroll {
          padding: .9rem 1.1rem;
          display: grid;
          gap: .6rem;
          max-height: 24rem;
          overflow-y: auto;
          align-content: start;
        }
        .assistant-empty { display: grid; gap: .7rem; }
        .assistant-quick { display: flex; flex-wrap: wrap; gap: .35rem; }
        .assistant-chip {
          font-size: .72rem;
          padding: .35rem .6rem;
          border: 1px solid #e2dcce;
          border-radius: 999px;
          background: #fff;
          color: #3d3c31;
          text-align: left;
        }
        .assistant-chip:hover { border-color: #1b2ce0; background: #f4f5ff; }
        .assistant-msg { display: flex; }
        .assistant-msg--user { justify-content: flex-end; }
        .assistant-text {
          max-width: 90%;
          font-size: .8rem;
          line-height: 1.6;
          white-space: pre-wrap;
          padding: .55rem .7rem;
          border-radius: 8px;
        }
        .assistant-msg--assistant .assistant-text { background: #f6f2e8; border: 1px solid #e9e3d5; color: #2b2c22; }
        .assistant-msg--user .assistant-text { background: #1b2ce0; color: #fff; }
        .assistant-thinking { font-size: .74rem; padding: 0 1.1rem .5rem; }
        .assistant-error { font-size: .74rem; color: #96331f; padding: 0 1.1rem .5rem; }
        .assistant-input-row {
          display: flex;
          gap: .4rem;
          padding: .7rem 1.1rem .9rem;
          border-top: 1px solid #e2dcce;
        }
        .assistant-input-row .a-input { flex: 1; }
      `}</style>
    </section>
  );
}
