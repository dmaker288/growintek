"use client";

import { useActionState, useState } from "react";
import { loginWithPassword } from "@/lib/actions/auth";
import type { AuthState } from "@/lib/action-types";

const initial: AuthState = { email: "dmaker288@gmail.com" };

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginWithPassword, initial);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-card">
      <div className="login-brand">
        <span className="login-mark" aria-hidden="true">G</span>
        <span className="login-brand-name">GrowinTek</span>
      </div>

      <h1 className="login-title">Admin Sign In</h1>
      <p className="login-sub">
        Enter your admin credentials to access the GrowinTek management dashboard.
      </p>

      <form action={action} className="login-form">
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
            placeholder="admin@growintek.com"
            autoFocus
          />
        </div>

        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor="password">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="pwd-toggle"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="input"
            placeholder="••••••••••••"
          />
        </div>

        {state.error && (
          <div className="login-error-box" role="alert">
            <span className="error-icon" aria-hidden="true">!</span>
            <span>{state.error}</span>
          </div>
        )}

        <button type="submit" className="btn btn--cobalt login-btn" disabled={pending}>
          {pending ? "Signing in…" : "Sign in to Dashboard"}
        </button>
      </form>

      <p className="login-foot">
        Authorized administrative access only. Session is preserved securely for 30 days.
      </p>

      <style>{`
        .login-card {
          width: 100%;
          max-width: 26rem;
          display: grid;
          gap: 1rem;
          padding: 2.2rem;
          background: #fffdf8;
          border: 1px solid #e2dcce;
          border-radius: 12px;
          box-shadow: 0 30px 60px -40px rgba(20,21,15,.6);
        }
        .login-brand { display: inline-flex; align-items: center; gap: .5rem; margin-bottom: .2rem; }
        .login-mark {
          display: grid; place-items: center;
          width: 28px; height: 28px; border-radius: 6px;
          background: #1b2ce0; color: #fff;
          font-size: .85rem; font-weight: 600;
        }
        .login-brand-name { font-family: var(--font-display), serif; font-size: 1.15rem; letter-spacing: -.02em; }
        .login-title { font-family: var(--font-display), serif; font-size: 1.8rem; font-weight: 500; letter-spacing: -.03em; margin: 0; }
        .login-sub { font-size: .88rem; color: #6d6a5b; line-height: 1.5; margin: 0; }
        .login-form { display: grid; gap: 1.1rem; margin-top: .4rem; }
        .login-btn { width: 100%; justify-content: center; font-size: .95rem; padding: .75rem 1rem; }
        .pwd-toggle {
          background: none; border: none; padding: 0;
          font-size: .75rem; color: #1b2ce0; cursor: pointer; text-decoration: underline;
        }
        .login-error-box {
          display: flex; align-items: center; gap: .55rem;
          padding: .65rem .85rem;
          background: #fdf2f0;
          border: 1px solid #f2cfc7;
          border-radius: 6px;
          font-size: .82rem; color: #96331f;
        }
        .error-icon {
          display: inline-grid; place-items: center;
          width: 18px; height: 18px; border-radius: 50%;
          background: #96331f; color: #fff; font-size: .7rem; font-weight: bold; flex-shrink: 0;
        }
        .login-foot { font-size: .72rem; color: #9a9684; line-height: 1.5; border-top: 1px solid #e2dcce; padding-top: .9rem; margin: 0; }
      `}</style>
    </div>
  );
}
