import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import LeadForm from "@/components/site/LeadForm";

export const metadata: Metadata = {
  title: "Start a project",
  description:
    "Send a short brief and get a fixed-scope quote within two working days.",
  alternates: { canonical: "/start" },
};

const plans: Record<string, string> = {
  core: "Core",
  system: "System",
  managed: "Managed",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const planName = plan ? (plans[plan] ?? undefined) : undefined;

  return (
    <>
      <PageHero
        eyebrow="Start"
        title={
          <>
            A short brief
            <br />
            <em>is enough.</em>
          </>
        }
        lede="Three sentences about the problem is more useful than a 40-page requirements document. You get a written scope and a fixed price within two working days."
        aside={
          <div className="hero-aside">
            <p className="mono tiny">What you get back</p>
            <p className="small">
              A scope document, a fixed price, a start date, and an honest answer
              if we are not the right studio for it.
            </p>
          </div>
        }
      />

      <section className="section section--tight">
        <div className="wrap start-grid">
          <div>
            <LeadForm defaultPlan={planName} />
          </div>
          <aside className="start-side">
            <div className="start-card">
              <p className="eyebrow">Before you send</p>
              <ul className="start-list">
                <li>
                  <strong>What happens now?</strong> The current process, including the
                  bits that are manual.
                </li>
                <li>
                  <strong>What should happen instead?</strong> The outcome you would
                  describe to a friend.
                </li>
                <li>
                  <strong>What is the deadline?</strong> A date, a season, or “no rush”.
                </li>
                <li>
                  <strong>What is the budget?</strong> A range is fine. It saves us both
                  a call.
                </li>
              </ul>
            </div>
            <div className="start-card start-card--plain">
              <p className="eyebrow">Prefer to talk?</p>
              <p className="small muted">
                Email works too. Reply within one working day.
              </p>
              <Link href="/contact" className="text-link small">Contact options →</Link>
            </div>
          </aside>
        </div>

        <style>{`
          .start-grid { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: var(--s-7); align-items: start; }
          .start-side { display: grid; gap: var(--s-4); }
          .start-card {
            padding: var(--s-5);
            border: 1px solid var(--rule);
            border-radius: var(--radius-lg);
            background: var(--paper-raised);
            display: grid;
            gap: .75rem;
          }
          .start-card--plain { background: transparent; }
          .start-list { display: grid; gap: .7rem; }
          .start-list li { font-size: var(--step--1); color: var(--ink-mute); line-height: 1.55; }
          .start-list strong { color: var(--ink); font-weight: 600; }
          @media (max-width: 960px) { .start-grid { grid-template-columns: 1fr; } }
        `}</style>
      </section>
    </>
  );
}
