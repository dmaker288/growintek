"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="newsletter">
      <label htmlFor="nl-email" className="eyebrow">
        One useful email a month
      </label>
      {state === "done" ? (
        <p className="newsletter-done">
          You&apos;re in. Next issue lands on the first Tuesday.
        </p>
      ) : (
        <form onSubmit={submit} className="newsletter-form">
          <input
            id="nl-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="input newsletter-input"
            aria-describedby="nl-note"
          />
          <button
            type="submit"
            className="btn btn--sm"
            disabled={state === "sending"}
            data-cta="newsletter"
          >
            {state === "sending" ? "Adding…" : "Join"}
          </button>
        </form>
      )}
      <p id="nl-note" className="tiny muted">
        {state === "error"
          ? "That didn't go through. Try again in a moment."
          : "No pitching. Unsubscribe in one click."}
      </p>

      <style>{`
        .newsletter { display: grid; gap: .55rem; }
        .newsletter-form { display: flex; gap: .5rem; max-width: 26rem; }
        .newsletter-input { min-height: 40px; font-size: var(--step--1); }
        .newsletter-done { font-size: var(--step--1); color: var(--cobalt); font-weight: 500; }
      `}</style>
    </div>
  );
}
