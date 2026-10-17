"use client";

import { useActionState } from "react";
import { startSignIn, submitCode, backToEmail } from "@/lib/actions/auth";
import type { AuthState } from "@/lib/action-types";

const initial: AuthState = { step: "email", email: "" };

export default function LoginForm() {
  const [state, action, pending] = useActionState(submitOrStart, initial);

  return (
    <div className="login-card">
      <div className="login-brand">
        <span className="login-mark" aria-hidden="true">G</span>
        <span className="login-brand-name">GrowinTek</span>
      </div>

      {state.step === "email" ? (
        <>
          <h1 className="login-title">Sign in</h1>
          <p className="login-sub">
            Enter the email on your account. We will send a six-digit code —
            there is no password to remember.
          </p>
          <form action={action} className="login-form">
            <input type="hidden" name="_intent" value="email" />
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={state.email}
                className="input"
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            {state.error && <p className="login-error">{state.error}</p>}
            <button type="submit" className="btn btn--cobalt login-btn" disabled={pending}>
              {pending ? "Sending…" : "Send the code"}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="login-title">Enter your code</h1>
          <p className="login-sub">
            {state.info ?? `We sent a six-digit code to ${state.email}.`}
          </p>
          <form action={action} className="login-form">
            <input type="hidden" name="_intent" value="code" />
            <input type="hidden" name="email" value={state.email} />
            <div className="field">
              <label htmlFor="code">Six-digit code</label>
              <input
                id="code"
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                required
                className="input input--mono login-code"
                placeholder="000000"
                autoFocus
              />
            </div>
            {state.error && <p className="login-error">{state.error}</p>}
            <button type="submit" className="btn btn--cobalt login-btn" disabled={pending}>
              {pending ? "Checking…" : "Sign in"}
            </button>
          </form>
          <form action={action} className="login-back">
            <input type="hidden" name="_intent" value="back" />
            <input type="hidden" name="email" value={state.email} />
            <button type="submit">Use a different email</button>
          </form>
        </>
      )}

      <p className="login-foot">
        Codes expire after 10 minutes. Five wrong attempts locks the code — request a new one.
      </p>

      <style>{`
        .login-card {
          width: 100%;
          max-width: 25rem;
          display: grid;
          gap: .9rem;
          padding: 2rem;
          background: #fffdf8;
          border: 1px solid #e2dcce;
          border-radius: 12px;
          box-shadow: 0 30px 60px -40px rgba(20,21,15,.6);
        }
        .login-brand { display: inline-flex; align-items: center; gap: .5rem; margin-bottom: .4rem; }
        .login-mark {
          display: grid; place-items: center;
          width: 26px; height: 26px; border-radius: 6px;
          background: #1b2ce0; color: #fff;
          font-size: .8rem; font-weight: 600;
        }
        .login-brand-name { font-family: var(--font-display), serif; font-size: 1.15rem; letter-spacing: -.02em; }
        .login-title { font-family: var(--font-display), serif; font-size: 1.7rem; font-weight: 500; letter-spacing: -.03em; }
        .login-sub { font-size: .85rem; color: #6d6a5b; line-height: 1.55; }
        .login-form { display: grid; gap: .9rem; margin-top: .4rem; }
        .login-btn { width: 100%; justify-content: center; }
        .login-error { font-size: .8rem; color: #96331f; }
        .login-code { letter-spacing: .4em; font-size: 1.15rem; text-align: center; }
        .login-back { text-align: center; }
        .login-back button { font-size: .78rem; color: #6d6a5b; text-decoration: underline; text-underline-offset: .2em; }
        .login-back button:hover { color: #1b2ce0; }
        .login-foot { font-size: .7rem; color: #9a9684; line-height: 1.5; border-top: 1px solid #e2dcce; padding-top: .85rem; }
      `}</style>
    </div>
  );
}

async function submitOrStart(prev: AuthState, formData: FormData): Promise<AuthState> {
  const intent = String(formData.get("_intent") ?? "email");
  if (intent === "code") return submitCode(prev, formData);
  if (intent === "back") return backToEmail(prev, formData);
  return startSignIn(prev, formData);
}
