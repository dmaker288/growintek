import type { Metadata } from "next";
import Link from "next/link";
import LegalStyles from "@/components/site/LegalStyles";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie notice",
  description:
    "The public site sets no tracking cookies. Only one essential admin session cookie exists.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <article className="legal">
      <div className="wrap wrap--narrow">
        <p className="eyebrow eyebrow--cobalt">Legal</p>
        <h1 className="display legal-title">Cookie notice</h1>
        <p className="legal-updated mono">Last updated: {new Date().getFullYear()}</p>

        <div className="prose legal-body">
          <h2>In short</h2>
          <p>
            The public site sets no cookies at all. There is no consent banner because
            there is no cookie to consent to. Analytics are first-party and cookie-free.
          </p>

          <h2>The one cookie</h2>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Type</th>
                <th>Lifetime</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>gt_session</code></td>
                <td>
                  Keeps an authorised user signed in to <code>/admin</code>. It holds a
                  random token; the server stores only a SHA-256 hash of it.
                </td>
                <td>Essential</td>
                <td>30 days</td>
              </tr>
            </tbody>
          </table>
          <p>
            Set only after a successful sign-in. HttpOnly, SameSite=Lax, and Secure in
            production.
          </p>

          <h2>What replaces analytics cookies</h2>
          <p>
            Page views are recorded by our own endpoint using a one-way hash of your IP
            address, a secret salt and the current date. The hash changes daily and cannot
            be reversed to an address. Nothing is written to your browser. The{" "}
            <Link href="/privacy">privacy notice</Link> has the detail.
          </p>

          <h2>Third-party embeds</h2>
          <p>
            Social feeds — Instagram, YouTube and Facebook — are fetched server-side and
            served from our own database. No third-party script runs on the page, so those
            platforms do not see your visit. Clicking through to a platform puts you under
            their cookie policy.
          </p>

          <h2>Managing cookies</h2>
          <p>
            Deleting cookies in your browser has no effect on the public site. Deleting
            the admin cookie signs you out of the admin.
          </p>

          <p className="tiny muted">
            Operated by {site.name} · {site.email}
          </p>
        </div>
      </div>

      <LegalStyles />

      <style>{`
        .cookie-table { width: 100%; border-collapse: collapse; font-size: var(--step--1); margin: 1.5rem 0; }
        .cookie-table th {
          text-align: left; font-family: var(--font-mono); font-size: var(--step--2);
          text-transform: uppercase; letter-spacing: .08em; color: var(--ink-mute);
          border-bottom: 1px solid var(--rule-strong); padding: .6rem .5rem;
        }
        .cookie-table td { border-bottom: 1px solid var(--rule); padding: .7rem .5rem; color: var(--ink-soft); vertical-align: top; }
        .cookie-table code { font-family: var(--font-mono); font-size: .85em; }
      `}</style>
    </article>
  );
}
