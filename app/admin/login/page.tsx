import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");

  return (
    <div className="login-wrap">
      <LoginForm />
      <p className="login-note">
        Authorised users only. Activity is logged.
      </p>

      <style>{`
        .login-wrap {
          min-height: 100svh;
          display: grid;
          place-content: center;
          justify-items: center;
          gap: 1rem;
          padding: 2rem 1rem;
          background:
            radial-gradient(40rem 22rem at 50% -10%, rgba(27,44,224,.07), transparent 65%),
            var(--paper);
        }
        .login-note { font-family: var(--font-mono), monospace; font-size: .62rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); }
      `}</style>
    </div>
  );
}
