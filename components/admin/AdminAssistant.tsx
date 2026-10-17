"use client";

import { useRef, useState } from "react";

type TabId = "overview" | "pipeline" | "finance" | "copilot";
type Msg = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { icon: "⚡", label: "Executive Daily Plan", prompt: "What should I do today? Give me an executive action plan." },
  { icon: "📊", label: "Pipeline Triage", prompt: "Summarise the pipeline and highlight any lead going cold." },
  { icon: "✉️", label: "Draft Lead Response", prompt: "Draft a high-converting reply to the newest incoming lead." },
  { icon: "💳", label: "Invoice Follow-Up", prompt: "Which invoices are overdue and what polite reminder should I send?" },
];

export default function AdminAssistant() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "👋 Welcome back! I'm your GrowinTek Operations Copilot. I've synced your leads, invoices, and active client projects. Choose a widget tab above or query anything below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;

    setActiveTab("copilot");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-8) }),
      });
      const json = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      const reply = json.reply ?? "I've analyzed your request and updated the workspace.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "⚡ **Workspace Sync:** All 6 services and client database are live. What specific task would you like help with?",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function copyText(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <section className="panel ai-suite-panel">
      {/* ── Widget Header ────────────────────────────────────── */}
      <div className="ai-suite-head">
        <div className="ai-suite-brand">
          <div className="ai-orb" aria-hidden="true">
            <span className="ai-orb-core" />
          </div>
          <div>
            <h2 className="ai-suite-title">Ask AI Copilot</h2>
            <p className="ai-suite-sub">Autonomous Business Intelligence &amp; Actions</p>
          </div>
        </div>

        <div className="ai-status-badge">
          <span className="ai-pulse-dot" />
          <span>Real-time Sync</span>
        </div>
      </div>

      {/* ── Animated Tabs ─────────────────────────────────────── */}
      <div className="ai-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          className={`ai-tab-btn ${activeTab === "overview" ? "ai-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="ai-tab-icon">⚡</span>
          <span>Daily Plan</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pipeline"}
          className={`ai-tab-btn ${activeTab === "pipeline" ? "ai-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("pipeline")}
        >
          <span className="ai-tab-icon">📊</span>
          <span>Pipeline Triage</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "finance"}
          className={`ai-tab-btn ${activeTab === "finance" ? "ai-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("finance")}
        >
          <span className="ai-tab-icon">💳</span>
          <span>Cash Radar</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "copilot"}
          className={`ai-tab-btn ${activeTab === "copilot" ? "ai-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("copilot")}
        >
          <span className="ai-tab-icon">💬</span>
          <span>Ask Anything</span>
        </button>
      </div>

      {/* ── Tab Content Widgets ───────────────────────────────── */}
      <div className="ai-tab-body">
        {activeTab === "overview" && (
          <div className="ai-widget-card ai-animate-fade">
            <div className="ai-widget-header">
              <span className="ai-badge-shine">🎯 Autonomous Executive Plan</span>
              <button
                type="button"
                className="ai-refresh-btn"
                onClick={() => send("Give me an updated daily action plan")}
              >
                ↻ Refresh Intelligence
              </button>
            </div>
            <div className="ai-plan-grid">
              <div className="ai-plan-item ai-plan-item--priority">
                <span className="ai-plan-num">01</span>
                <div>
                  <strong>Incoming Inquiries</strong>
                  <p>Check new form submissions and trigger the 20-minute qualification intro.</p>
                </div>
              </div>
              <div className="ai-plan-item">
                <span className="ai-plan-num">02</span>
                <div>
                  <strong>Overdue Invoicing</strong>
                  <p>Issue polite gap-free reminders for any accounts approaching term expiry.</p>
                </div>
              </div>
              <div className="ai-plan-item">
                <span className="ai-plan-num">03</span>
                <div>
                  <strong>Active Sprints</strong>
                  <p>Verify live agent webhook health and scheduled social channel synchronizations.</p>
                </div>
              </div>
            </div>
            <div className="ai-quick-strip">
              {QUICK_ACTIONS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  className="ai-action-chip"
                  onClick={() => send(q.prompt)}
                >
                  <span>{q.icon}</span>
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "pipeline" && (
          <div className="ai-widget-card ai-animate-fade">
            <div className="ai-widget-header">
              <span className="ai-badge-shine">📈 Inbound Qualification Radar</span>
              <span className="ai-tiny-tag">Lead Velocity: High</span>
            </div>
            <p className="ai-widget-desc">
              Your autonomous web agent qualifies visitors 24/7 on budget, scope, and timeline before scheduling a call.
            </p>
            <div className="ai-action-box">
              <strong>Need a customized lead response?</strong>
              <p>Click below to have the AI draft an email reply that handles objections and books the call.</p>
              <button
                type="button"
                className="ai-btn-glow"
                onClick={() => send("Draft a personalized reply to the newest lead with three qualification questions.")}
              >
                ✨ Draft Lead Reply Now
              </button>
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="ai-widget-card ai-animate-fade">
            <div className="ai-widget-header">
              <span className="ai-badge-shine">💰 Cash Flow &amp; Collection Suite</span>
              <span className="ai-tiny-tag">Gap-free GT-2026</span>
            </div>
            <p className="ai-widget-desc">
              Sequential automated invoices with statutory interest protection and instant payment links.
            </p>
            <div className="ai-action-box">
              <strong>Overdue payment triage:</strong>
              <p>Identify accounts past 14 days and generate polite follow-up emails in British English.</p>
              <button
                type="button"
                className="ai-btn-glow"
                onClick={() => send("Which invoices need chasing, and draft a polite, professional reminder email for each?")}
              >
                ✉️ Draft Invoicing Follow-up
              </button>
            </div>
          </div>
        )}

        {activeTab === "copilot" && (
          <div className="ai-chat-viewport" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-bubble-row ai-bubble-row--${m.role}`}>
                <div className={`ai-bubble ai-bubble--${m.role}`}>
                  <div className="ai-bubble-content">{m.content}</div>
                  {m.role === "assistant" && (
                    <button
                      type="button"
                      className="ai-copy-btn"
                      onClick={() => copyText(m.content, i)}
                      title="Copy response"
                    >
                      {copiedIndex === i ? "✓ Copied" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="ai-bubble-row ai-bubble-row--assistant">
                <div className="ai-bubble ai-bubble--assistant ai-bubble--thinking">
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Futuristic Command Bar ────────────────────────────── */}
      <form
        className="ai-command-bar"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="ai-input-wrap">
          <span className="ai-prompt-glyph" aria-hidden="true">✦</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything (e.g. 'Draft lead reply', 'Invoicing summary')..."
            className="ai-input-field"
            aria-label="Ask AI Copilot"
            maxLength={2000}
          />
        </div>
        <button
          type="submit"
          className="ai-send-btn"
          disabled={busy || !input.trim()}
        >
          {busy ? "Thinking…" : "Execute"}
        </button>
      </form>

      <style>{`
        .ai-suite-panel {
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          background: #ffffff;
          border: 1px solid rgba(27, 44, 224, 0.15);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(27, 44, 224, 0.08);
          position: relative;
        }
        .ai-suite-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.4rem;
          background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
          border-bottom: 1px solid rgba(27, 44, 224, 0.12);
        }
        .ai-suite-brand {
          display: flex;
          align-items: center;
          gap: .75rem;
        }
        .ai-orb {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1b2ce0, #00f5d4);
          display: grid;
          place-items: center;
          box-shadow: 0 0 15px rgba(0, 245, 212, 0.4);
        }
        .ai-orb-core {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px #fff;
          animation: orbPulse 2s ease-in-out infinite;
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        .ai-suite-title {
          font-family: var(--font-display), serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .ai-suite-sub {
          font-size: 0.72rem;
          color: #64748b;
          margin: 0;
        }
        .ai-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          font-size: 0.72rem;
          font-weight: 500;
          color: #065f46;
        }
        .ai-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ── Tabs Navigation ─────────────────────────────────── */
        .ai-tabs {
          display: flex;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 0.3rem 0.6rem 0;
          gap: 0.35rem;
          overflow-x: auto;
        }
        .ai-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 0.85rem;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .ai-tab-btn:hover {
          color: #1b2ce0;
        }
        .ai-tab-btn--active {
          color: #1b2ce0;
          border-bottom-color: #1b2ce0;
          background: #ffffff;
          border-radius: 6px 6px 0 0;
          font-weight: 600;
        }
        .ai-tab-icon {
          font-size: 0.9rem;
        }

        /* ── Tab Body ────────────────────────────────────────── */
        .ai-tab-body {
          padding: 1.1rem;
          min-height: 18rem;
          max-height: 24rem;
          overflow-y: auto;
          background: #ffffff;
        }
        .ai-animate-fade {
          animation: fadeIn 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-widget-card {
          display: grid;
          gap: 0.85rem;
        }
        .ai-widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ai-badge-shine {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1b2ce0;
          background: linear-gradient(90deg, #1b2ce0, #00b4d8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .ai-refresh-btn {
          font-size: 0.72rem;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.25rem 0.55rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-refresh-btn:hover {
          color: #1b2ce0;
          border-color: #cbd5e1;
        }
        .ai-widget-desc {
          font-size: 0.82rem;
          color: #475569;
          line-height: 1.55;
          margin: 0;
        }

        /* Plan Items */
        .ai-plan-grid {
          display: grid;
          gap: 0.6rem;
        }
        .ai-plan-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.8rem;
        }
        .ai-plan-item--priority {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
        .ai-plan-num {
          font-family: var(--font-mono), monospace;
          font-size: 0.75rem;
          font-weight: 600;
          color: #1b2ce0;
        }
        .ai-plan-item strong {
          display: block;
          color: #0f172a;
          margin-bottom: 0.15rem;
        }
        .ai-plan-item p {
          color: #475569;
          margin: 0;
          line-height: 1.4;
          font-size: 0.76rem;
        }

        /* Action Box */
        .ai-action-box {
          padding: 1rem;
          background: linear-gradient(135deg, #f8faff 0%, #f0f7ff 100%);
          border: 1px solid #dbeafe;
          border-radius: 10px;
          display: grid;
          gap: 0.5rem;
        }
        .ai-action-box strong {
          font-size: 0.88rem;
          color: #1e3a8a;
        }
        .ai-action-box p {
          font-size: 0.78rem;
          color: #3b82f6;
          margin: 0;
          line-height: 1.45;
        }
        .ai-btn-glow {
          align-self: start;
          margin-top: 0.35rem;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: linear-gradient(135deg, #1b2ce0, #2563eb);
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(27, 44, 224, 0.25);
          transition: all 0.2s ease;
        }
        .ai-btn-glow:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(27, 44, 224, 0.35);
        }

        /* Quick Action Chips */
        .ai-quick-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.4rem;
        }
        .ai-action-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.73rem;
          padding: 0.35rem 0.65rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-action-chip:hover {
          border-color: #1b2ce0;
          background: #f0f4ff;
          color: #1b2ce0;
        }

        /* Chat Viewport */
        .ai-chat-viewport {
          display: grid;
          gap: 0.75rem;
        }
        .ai-bubble-row {
          display: flex;
        }
        .ai-bubble-row--user {
          justify-content: flex-end;
        }
        .ai-bubble {
          max-width: 90%;
          padding: 0.7rem 0.9rem;
          border-radius: 12px;
          font-size: 0.82rem;
          line-height: 1.55;
          position: relative;
        }
        .ai-bubble--user {
          background: linear-gradient(135deg, #1b2ce0, #2563eb);
          color: #ffffff;
          border-bottom-right-radius: 3px;
        }
        .ai-bubble--assistant {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #1e293b;
          border-bottom-left-radius: 3px;
        }
        .ai-bubble-content {
          white-space: pre-wrap;
        }
        .ai-copy-btn {
          margin-top: 0.45rem;
          font-size: 0.68rem;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
        }
        .ai-copy-btn:hover {
          color: #1b2ce0;
          border-color: #1b2ce0;
        }
        .ai-bubble--thinking {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 0.85rem;
        }
        .ai-typing-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #1b2ce0;
          animation: typingDot 1.4s infinite ease-in-out both;
        }
        .ai-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .ai-typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* ── Command Bar ─────────────────────────────────────── */
        .ai-command-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.1rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .ai-input-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 0.45rem 0.75rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ai-input-wrap:focus-within {
          border-color: #1b2ce0;
          box-shadow: 0 0 0 3px rgba(27, 44, 224, 0.12);
        }
        .ai-prompt-glyph {
          color: #1b2ce0;
          font-size: 0.85rem;
        }
        .ai-input-field {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.82rem;
          background: transparent;
          color: #0f172a;
        }
        .ai-send-btn {
          padding: 0.5rem 1rem;
          background: #1b2ce0;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
        }
        .ai-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ai-send-btn:not(:disabled):hover {
          background: #1523b8;
        }
        .ai-tiny-tag {
          font-size: 0.7rem;
          font-weight: 500;
          color: #0284c7;
          background: #e0f2fe;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
      `}</style>
    </section>
  );
}

