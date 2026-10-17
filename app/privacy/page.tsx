import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import LegalStyles from "@/components/site/LegalStyles";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How GrowinTek collects, uses and stores personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="legal">
      <div className="wrap wrap--narrow">
        <p className="eyebrow eyebrow--cobalt">Legal</p>
        <h1 className="display legal-title">Privacy notice</h1>
        <p className="legal-updated mono">Last updated: {new Date().getFullYear()}</p>

        <div className="notice">
          <strong>Template — not legal advice.</strong> This notice describes what the
          site actually does, which is the hard part. Have a solicitor confirm it fits
          your entity and jurisdiction before launch.
        </div>

        <div className="prose legal-body">
          <h2>Who is responsible</h2>
          <p>
            {site.name} operates {site.domain}. For data protection questions, write to{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>. If you are in the UK, the
            supervisory authority is the Information Commissioner&apos;s Office (ICO). If
            you are in Australia, it is the Office of the Australian Information
            Commissioner (OAIC).
          </p>

          <h2>What we collect, and why</h2>
          <p>
            <strong>Enquiries.</strong> When you submit the contact or project form we
            store your name, email, business name, phone number (if given), country,
            budget range, service interest and message. We use this to reply and, if we
            work together, to deliver the project. Lawful basis: legitimate interests
            (responding to a business enquiry) and, where a contract follows, performance
            of that contract.
          </p>
          <p>
            <strong>Client and billing records.</strong> For clients we hold contact
            details, billing address, VAT or ABN number and invoice history. We are
            required to keep financial records for at least six years in the UK and five
            years in Australia. Lawful basis: legal obligation and contract.
          </p>
          <p>
            <strong>Newsletter.</strong> Only if you submit your email to the newsletter
            form. Lawful basis: consent, withdrawable at any time via the unsubscribe
            link or by emailing us.
          </p>
          <p>
            <strong>Analytics.</strong> We record page views and button clicks. This is
            described in detail below and does not use cookies.
          </p>

          <h2>Analytics without cookies</h2>
          <p>
            We do not use Google Analytics by default and we do not set advertising
            cookies. Instead, the site records the page path, the referring domain, a
            coarse device and browser type, and a visitor identifier derived from a
            one-way hash of your IP address combined with a secret salt and the current
            date.
          </p>
          <ul>
            <li>The IP address itself is never stored.</li>
            <li>The hash changes every day, so it cannot track you across days.</li>
            <li>No query strings, keystrokes or form contents are recorded.</li>
            <li>We do not sell or share this data, and we do not build advertising profiles.</li>
          </ul>
          <p>
            Because this is strictly necessary for measuring our own site and does not
            identify you, we treat it under legitimate interests rather than consent — the
            same reasoning used for server logs. If you object, use a browser-level
            tracker blocker; the site works normally without analytics.
          </p>

          <h2>Cookies</h2>
          <p>
            The public site sets no cookies. The admin area sets one essential session
            cookie (<code>gt_session</code>), which is httpOnly, SameSite=Lax and expires
            after 30 days. See the <Link href="/cookies">cookie notice</Link>.
          </p>

          <h2>Who else sees your data</h2>
          <p>We use a small number of processors, each under a data processing agreement:</p>
          <ul>
            <li><strong>Hosting and delivery</strong> — the platform serving this site.</li>
            <li><strong>Database</strong> — Prisma Postgres, storing the records described above.</li>
            <li><strong>Email delivery</strong> — our transactional email provider, for replies and sign-in codes.</li>
            <li><strong>Google Business Profile, Trustpilot, Meta, YouTube</strong> — if you leave a public review or interact with our public posts, that platform processes it under its own policy. We display public reviews and posts using their APIs.</li>
          </ul>
          <p>
            Some processors are outside the UK/EEA. Where that happens, transfers rely on
            the UK International Data Transfer Addendum or Standard Contractual Clauses.
          </p>

          <h2>How long we keep it</h2>
          <ul>
            <li>Enquiries that do not become clients: up to 24 months, then deleted.</li>
            <li>Client and invoice records: six years (UK) or five years (Australia) from the end of the financial year.</li>
            <li>Analytics events: 14 months, then deleted.</li>
            <li>Newsletter subscribers: until you unsubscribe.</li>
          </ul>

          <h2>Your rights</h2>
          <p>
            You can ask for a copy of your data, ask us to correct or delete it, object to
            processing based on legitimate interests, or ask us to restrict it. Write to{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a> and we will respond within
            one month. You also have the right to complain to the ICO or the OAIC.
          </p>

          <h2>Security</h2>
          <p>
            Access to the admin is passwordless, limited to authorised addresses, and
            sessions are stored as hashes rather than raw tokens. Data is encrypted in
            transit. We do not claim to be immune to breaches; if one affects your data we
            will tell you and the regulator within the statutory timeframe.
          </p>

          <h2>Changes</h2>
          <p>
            If this notice changes materially, the date at the top changes and existing
            clients are told by email.
          </p>
        </div>
      </div>

      <LegalStyles />
    </article>
  );
}
