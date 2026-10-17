"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

const OPENERS = [
  "What would an AI agent actually do for my business?",
  "What does a website cost?",
  "I lose enquiries after hours — can you fix that?",
];

export default function SiteAgent({ enabled = true }: { enabled?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-8) }),
      });
      const json = (await res.json().catch(() => ({}))) as { reply?: string; error?: string; remaining?: number };

      if (!res.ok || !json.reply) {
        setError(json.error ?? "That did not go through. Email hello@growintek.com and we will reply directly.");
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: json.reply! }]);
      if (typeof json.remaining === "number") setRemaining(json.remaining);
    } catch {
      setError("Network problem. Email hello@growintek.com instead.");
    } finally {
      setBusy(false);
    }
  }

  // Never render on the admin, and stay silent if the model is not configured.
  if (!enabled || pathname?.startsWith("/admin")) return null;

  return (
    <div className="agent">
      <button
        type="button"
        className={`agent-fab ${open ? "agent-fab--open" : ""}`}
        aria-expanded={open}
        aria-controls="agent-panel"
        aria-label={open ? "Close the assistant" : "Ask GrowinTek a question"}
        onClick={() => setOpen((v) => !v)}
        data-cta="agent-open"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <span className="agent-fab-dot" aria-hidden="true" />
            Ask a question
          </>
        )}
      </button>

      {open && (
        <div
          id="agent-panel"
          className="agent-panel"
          role="dialog"
          aria-modal="false"
          aria-label="GrowinTek assistant"
          ref={panelRef}
        >
          <header className="agent-head">
            <div>
              <p className="agent-title">GrowinTek assistant</p>
              <p className="agent-sub">Answers about services and pricing · AI, not a person</p>
            </div>
            <span className="agent-badge" aria-hidden="true">AI</span>
          </header>

          <div className="agent-list" ref={listRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="agent-intro">
                <p>
                  Twenty minutes of questions, answered without a form. If you want a
                  human, say so and we will point you to email.
                </p>
                <div className="agent-openers">
                  {OPENERS.map((o) => (
                    <button key={o} type="button" className="agent-opener" onClick={() => send(o)}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`agent-msg agent-msg--${m.role}`}>
                <div className="agent-bubble">{m.content}</div>
              </div>
            ))}

            {busy && (
              <div className="agent-msg agent-msg--assistant">
                <div className="agent-bubble agent-typing" aria-label="Thinking">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {error && (
              <p className="agent-error" role="alert">
                {error}{" "}
                <a href="mailto:hello@growintek.com">Email instead</a>
              </p>
            )}
          </div>

          <form
            className="agent-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="agent-input" className="sr-only">
              Your question
            </label>
            <input
              id="agent-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a website, an agent or pricing…"
              maxLength={1500}
              className="agent-input"
              disabled={busy}
            />
            <button
              type="submit"
              className="agent-send"
              disabled={busy || !input.trim()}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>

          <p className="agent-foot">
            {remaining !== null
              ? `${remaining} messages left today`
              : "No booking is made here. A human confirms every date."}
          </p>
        </div>
      )}

      <style>{`
        .agent {
          position: fixed;
          right: clamp(1rem, 2.5vw, 1.75rem);
          bottom: clamp(1rem, 2.5vw, 1.75rem);
          z-index: 45;
          display: grid;
          justify-items: end;
          gap: .6rem;
          pointer-events: none;
        }
        .agent > * { pointer-events: auto; }

        .agent-fab {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          min-height: 44px;
          padding: 0 1rem;
          border-radius: 999px;
          background: var(--ink);
          color: var(--paper-raised);
          font-size: .82rem;
          font-weight: 550;
          box-shadow: 0 14px 28px -16px rgba(20,21,15,.7);
          transition: background var(--dur) var(--ease), transform var(--dur) var(--ease);
        }
        .agent-fab:hover { background: var(--cobalt); transform: translateY(-1px); }
        .agent-fab--open { background: var(--cobalt); padding: 0 .85rem; }
        .agent-fab-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--sage);
          box-shadow: 0 0 0 3px rgba(167,183,154,.28);
        }

        .agent-panel {
          width: min(23rem, calc(100vw - 2rem));
          max-height: min(32rem, calc(100vh - 7rem));
          display: grid;
          grid-template-rows: auto 1fr auto auto;
          background: var(--paper-raised);
          border: 1px solid var(--rule-strong);
          border-radius: 14px;
          box-shadow: 0 30px 60px -30px rgba(20,21,15,.55);
          overflow: hidden;
          animation: agent-in .2s var(--ease);
        }
        @keyframes agent-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }

        .agent-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: .75rem;
          padding: .8rem .95rem;
          border-bottom: 1px solid var(--rule);
          background: var(--paper);
        }
        .agent-title { font-size: .84rem; font-weight: 650; }
        .agent-sub { font-size: .64rem; color: var(--ink-mute); margin-top: .1rem; }
        .agent-badge {
          font-family: var(--font-mono);
          font-size: .54rem;
          letter-spacing: .12em;
          padding: .2em .45em;
          border-radius: 4px;
          background: var(--cobalt-wash);
          color: var(--cobalt-deep);
        }

        .agent-list {
          overflow-y: auto;
          padding: .85rem;
          display: grid;
          gap: .6rem;
          align-content: start;
          overscroll-behavior: contain;
        }
        .agent-intro { display: grid; gap: .7rem; }
        .agent-intro p { font-size: .78rem; line-height: 1.55; color: var(--ink-soft); }
        .agent-openers { display: grid; gap: .35rem; }
        .agent-opener {
          text-align: left;
          font-size: .74rem;
          line-height: 1.4;
          padding: .5rem .65rem;
          border: 1px solid var(--rule);
          border-radius: 8px;
          background: var(--paper);
          color: var(--ink-soft);
          transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease);
        }
        .agent-opener:hover { border-color: var(--cobalt); background: var(--cobalt-wash); }

        .agent-msg { display: flex; }
        .agent-msg--user { justify-content: flex-end; }
        .agent-bubble {
          max-width: 87%;
          padding: .55rem .7rem;
          border-radius: 12px;
          font-size: .78rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .agent-msg--assistant .agent-bubble {
          background: var(--paper);
          border: 1px solid var(--rule);
          border-bottom-left-radius: 4px;
          color: var(--ink-soft);
        }
        .agent-msg--user .agent-bubble {
          background: var(--cobalt);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .agent-typing { display: inline-flex; gap: 3px; padding: .7rem; }
        .agent-typing span {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--ink-faint);
          animation: agent-blink 1.1s infinite ease-in-out;
        }
        .agent-typing span:nth-child(2) { animation-delay: .15s; }
        .agent-typing span:nth-child(3) { animation-delay: .3s; }
        @keyframes agent-blink {
          0%, 80%, 100% { opacity: .3; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
        .agent-error { font-size: .72rem; color: var(--rust); line-height: 1.45; }
        .agent-error a { color: var(--rust); text-decoration: underline; }

        .agent-form {
          display: flex;
          gap: .4rem;
          padding: .6rem .7rem;
          border-top: 1px solid var(--rule);
          background: var(--paper);
        }
        .agent-input {
          flex: 1;
          min-height: 38px;
          padding: .45em .65em;
          border: 1px solid var(--rule-strong);
          border-radius: 8px;
          background: var(--paper-raised);
          font-size: .78rem;
        }
        .agent-input:focus { outline: none; border-color: var(--cobalt); box-shadow: 0 0 0 3px rgba(27,44,224,.12); }
        .agent-send {
          display: grid;
          place-items: center;
          width: 38px; height: 38px;
          border-radius: 8px;
          background: var(--cobalt);
          color: #fff;
          transition: background var(--dur) var(--ease), opacity var(--dur) var(--ease);
        }
        .agent-send:hover:not(:disabled) { background: var(--cobalt-deep); }
        .agent-send:disabled { opacity: .45; cursor: not-allowed; }

        .agent-foot {
          padding: .4rem .8rem .55rem;
          font-size: .6rem;
          color: var(--ink-faint);
          background: var(--paper);
        }

        @media (max-width: 520px) {
          .agent { right: .8rem; bottom: .8rem; left: .8rem; justify-items: stretch; }
          .agent-fab { justify-self: end; }
          .agent-panel {
            width: 100%;
            max-height: calc(100dvh - 6rem);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .agent-panel { animation: none; }
          .agent-typing span { animation: none; }
        }
      `}</style>
    </div>
  );
}
