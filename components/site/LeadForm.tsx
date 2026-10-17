"use client";

import { useState } from "react";

type State = "idle" | "sending" | "done" | "error";

const BUDGETS = [
  "Under £1,500",
  "£1,500 – £3,500",
  "£3,500 – £6,000",
  "£6,000+",
  "Not sure yet",
];

const SERVICES = [
  "Website",
  "AI agent / chatbot",
  "Automation",
  "IT & support",
  "Not sure — help me choose",
];

export default function LeadForm({ defaultPlan }: { defaultPlan?: string }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");

    const form = new FormData(e.currentTarget);
    const payload: Record<string, string | boolean> = {};
    form.forEach((value, key) => {
      payload[key] = value.toString();
    });
    payload.consent = form.get("consent") === "on";
    if (defaultPlan) payload.plan = defaultPlan;

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "That didn't send. Try email instead.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Network error. Try email instead.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="form-done">
        <p className="eyebrow">Received</p>
        <h2 className="display" style={{ fontSize: "var(--step-4)", margin: ".6rem 0 1rem" }}>
          That reached us.
        </h2>
        <p className="lede">
          You will get a reply within one working day, from the person who would
          do the work. If you did not get a confirmation by then, check spam,
          then email directly.
        </p>
        <style>{`
          .form-done { padding: var(--s-6); border: 1px solid var(--rule); border-radius: var(--radius-lg); background: var(--paper-raised); display: grid; gap: .5rem; }
        `}</style>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={onSubmit} noValidate>
      <div className="form-head">
        <p className="eyebrow">{defaultPlan ? `Starting with ${defaultPlan}` : "Project brief"}</p>
        <h2 className="form-title">Six fields. Two minutes.</h2>
        <p className="small muted">
          Required fields are marked. Nothing here is shared with anyone else.
        </p>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Your name <span aria-hidden="true">*</span></label>
          <input id="name" name="name" required autoComplete="name" className="input" />
        </div>

        <div className="field">
          <label htmlFor="email">Email <span aria-hidden="true">*</span></label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>

        <div className="field">
          <label htmlFor="company">Business</label>
          <input id="company" name="company" autoComplete="organization" className="input" />
        </div>

        <div className="field">
          <label htmlFor="phone">Phone <span className="field-hint">optional</span></label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" />
        </div>

        <div className="field">
          <label htmlFor="country">Where you trade</label>
          <select id="country" name="country" className="select" defaultValue="GB">
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="IE">Ireland</option>
            <option value="EU">Europe</option>
            <option value="US">United States</option>
            <option value="OT">Somewhere else</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="service">What do you need?</label>
          <select id="service" name="service" className="select" defaultValue={SERVICES[0]}>
            {SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="field field--full">
          <label htmlFor="budget">Rough budget</label>
          <div className="budget-row" role="radiogroup" aria-label="Rough budget">
            {BUDGETS.map((b) => (
              <label key={b} className="budget-opt">
                <input type="radio" name="budget" value={b} defaultChecked={b === BUDGETS[1]} />
                <span>{b}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field field--full">
          <label htmlFor="message">What is the problem? <span aria-hidden="true">*</span></label>
          <textarea
            id="message"
            name="message"
            required
            className="textarea"
            placeholder="Three sentences is plenty. What happens now, and what you want to happen instead."
            minLength={20}
          />
        </div>

        <div className="field field--full">
          <label className="consent">
            <input type="checkbox" name="consent" required />
            <span className="small">
              You can email me about this enquiry. No newsletter unless I ask for it.
            </span>
          </label>
        </div>
      </div>

      {/* honeypot — a real person never sees or fills this */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="website_url">Website</label>
        <input id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="form-foot">
        <button type="submit" className="btn btn--cobalt" disabled={state === "sending"} data-cta="lead-submit">
          {state === "sending" ? "Sending…" : "Send the brief"}
          <svg width="12" height="12" viewBox="0 0 12 12" className="arrow" aria-hidden="true">
            <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
        <p className="tiny muted">
          No spam, no sequence, no automated follow-ups you did not ask for.
        </p>
      </div>

      <style>{`
        .lead-form {
          display: grid;
          gap: var(--s-5);
          padding: clamp(1.25rem, 3vw, 2rem);
          border: 1px solid var(--rule);
          border-radius: var(--radius-lg);
          background: var(--paper-raised);
        }
        .form-head { display: grid; gap: .35rem; }
        .form-title { font-family: var(--font-display); font-size: var(--step-3); letter-spacing: -.025em; }
        .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-4); }
        .field--full { grid-column: 1 / -1; }

        .budget-row { display: flex; flex-wrap: wrap; gap: .4rem; }
        .budget-opt { position: relative; }
        .budget-opt input {
          position: absolute;
          opacity: 0;
          inset: 0;
          cursor: pointer;
        }
        .budget-opt span {
          display: inline-block;
          padding: .5rem .8rem;
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--rule-strong);
          border-radius: var(--radius-pill);
          font-size: var(--step--1);
          color: var(--ink-soft);
          background: var(--paper);
          transition: all var(--dur) var(--ease);
        }
        .budget-opt input:checked + span {
          background: var(--cobalt);
          border-color: var(--cobalt);
          color: #fff;
        }
        .budget-opt input:focus-visible + span { outline: 2px solid var(--cobalt); outline-offset: 2px; }

        .consent { display: flex; gap: .6rem; align-items: flex-start; cursor: pointer; }
        .consent input { margin-top: .28rem; width: 16px; height: 16px; accent-color: var(--cobalt); flex: none; }
        .consent .small { color: var(--ink-mute); line-height: 1.5; }

        .hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

        .form-foot { display: flex; flex-wrap: wrap; align-items: center; gap: .8rem 1.25rem; padding-top: var(--s-2); }

        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; }
          .form-foot .btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </form>
  );
}
