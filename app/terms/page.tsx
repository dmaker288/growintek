import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import LegalStyles from "@/components/site/LegalStyles";
export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of service for GrowinTek projects.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="legal">
      <div className="wrap wrap--narrow">
        <p className="eyebrow eyebrow--cobalt">Legal</p>
        <h1 className="display legal-title">Terms of service</h1>
        <p className="legal-updated mono">Last updated: {new Date().getFullYear()}</p>

        <div className="notice">
          <strong>Template — not legal advice.</strong> These are the terms we actually
          work to. Have a solicitor check them against your business structure before you
          publish a signed contract.
        </div>

        <div className="prose legal-body">
          <h2>1. Who this applies to</h2>
          <p>
            These terms cover the website at {site.domain} and any project work agreed
            between {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) and the client
            (&ldquo;you&rdquo;). Where a signed proposal or statement of work conflicts
            with these terms, the signed document wins.
          </p>

          <h2>2. Quotes and scope</h2>
          <p>
            Every project starts with a written scope and a fixed price. The scope lists
            what is included and what is not. Work outside the scope is quoted separately
            and needs your written approval before it starts. A quote is valid for 30 days.
          </p>

          <h2>3. Payment</h2>
          <p>
            Unless stated otherwise, 50% is due to book the slot and 50% on launch.
            Invoices are due within 14 days. We may pause work on overdue accounts after
            written notice. Late payment may incur statutory interest where permitted.
            Prices are in the currency stated on the invoice; VAT or GST is added where
            applicable.
          </p>

          <h2>4. Your responsibilities</h2>
          <ul>
            <li>Provide content, access and approvals within agreed timeframes.</li>
            <li>Make sure any content you supply does not infringe someone else&apos;s rights.</li>
            <li>Hold the accounts and licences needed for the third-party services we integrate.</li>
            <li>Nominate one decision-maker for approvals.</li>
          </ul>
          <p>
            Delays caused by missing content or approvals move the delivery date by at
            least the length of the delay.
          </p>

          <h2>5. Ownership and handover</h2>
          <p>
            On final payment, you own the website design, the code we wrote for you, and
            the content we produced for you. Domains, hosting, database, AI model accounts
            and API keys are created in your name from the start. We keep a licence to
            show the work in our portfolio unless you ask us not to in writing.
          </p>
          <p>
            Open-source components stay under their own licences. Third-party tools remain
            subject to their providers&apos; terms.
          </p>

          <h2>6. Care plans</h2>
          <p>
            Care plans are monthly, cancellable with 30 days&apos; notice, and cover the
            maintenance described in the plan. They do not cover new features, third-party
            price rises, or failures caused by changes you make outside the plan.
          </p>

          <h2>7. AI systems</h2>
          <p>
            AI agents are probabilistic systems. We test them against real enquiries and
            document their limits, but we cannot guarantee that every response will be
            correct in every situation. We will not build an agent that gives binding
            quotes, makes legal or medical claims, or acts without a human escalation path.
            You remain responsible for the decisions your business makes.
          </p>

          <h2>8. Liability</h2>
          <p>
            We provide services with reasonable skill and care. To the extent permitted by
            law, our total liability for any project is limited to the fees paid for that
            project, and we are not liable for indirect or consequential loss, including
            lost profit or lost data where you did not hold backups. Nothing here excludes
            liability for death, personal injury, or fraud.
          </p>

          <h2>9. Cancellation</h2>
          <p>
            You can cancel before work starts and receive your deposit back, less any
            third-party costs already incurred. After work has started, the deposit covers
            hours already worked and any remaining difference is invoiced pro rata. We can
            cancel if a project becomes abusive, unlawful, or materially different from the
            agreed scope.
          </p>

          <h2>10. Governing law</h2>
          <p>
            These terms are governed by the laws of England and Wales. Nothing in them
            removes rights you have as a consumer under local law.
          </p>

          <p>
            Questions about any of this? <Link href="/contact">Get in touch</Link>.
          </p>
        </div>
      </div>
      <LegalStyles />
    </article>
  );
}
