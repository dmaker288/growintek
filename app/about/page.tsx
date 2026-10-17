import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import CTABand from "@/components/site/CTABand";

export const metadata: Metadata = {
  title: "About",
  description:
    "GrowinTek is a small studio building websites, AI agents and automation for owner-run businesses in the UK and Australia.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    n: "01",
    title: "Boring beats clever",
    body: "A system you understand, documented in plain English, with a fallback when the API fails. Clever architecture that nobody can maintain is a liability, not a feature.",
  },
  {
    n: "02",
    title: "You own everything",
    body: "The domain, the repository, the hosting account, the agent prompts. Handing over a system you cannot leave is not a business model — it is a hostage situation.",
  },
  {
    n: "03",
    title: "Say no to bad fits",
    body: "If a £4,000 agent will not earn its keep for a business that gets 12 enquiries a month, we say so and quote the smaller job. The referral is worth more than the invoice.",
  },
  {
    n: "04",
    title: "Measure the thing that pays",
    body: "Not page views. Enquiries answered, time to first reply, bookings completed. If we cannot name the number we are moving, the project is not ready to start.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={
          <>
            A small studio
            <br />
            with <em>one opinion.</em>
          </>
        }
        lede="Most business websites are a brochure that nobody answers. We build the brochure and the person who answers it — in the same project, owned by you."
      />

      <section className="section section--tight">
        <div className="wrap about-grid">
          <div className="about-main prose">
            <p>
              GrowinTek is a two-person practice working with owner-run
              businesses in the UK, Australia and Ireland. We do four things:
              websites, AI agents, the automation that connects them, and the IT
              hygiene that keeps them running.
            </p>
            <p>
              The reason the studio exists is simple. Over and over, the same
              pattern shows up: a business pays for a site, the site gets
              enquiries, the enquiries arrive at 9pm and get answered three days
              later — or not at all. The website is rarely the problem. The gap
              between the enquiry and the reply is the problem.
            </p>
            <p>
              So the work is scoped around that gap. Sometimes the fix is a
              faster site with a better form. Sometimes it is an agent that
              replies in seconds and books the call. Sometimes it is just
              tidying the CRM so the follow-up actually happens. We will tell you
              which one you need, including when it is the cheap one.
            </p>

            <h2>How we work</h2>
            <p>
              Fixed scope, written down before anything starts. A weekly demo of
              the work in progress, not a status email. Content and accounts in
              your name from day one. Two projects running at a time, which
              means sometimes you wait for a slot — but the reply time stays
              honest and the work stays good.
            </p>

            <h2>What we are not</h2>
            <p>
              Not an agency with account managers and a pitch deck. Not a
              white-label reseller of somebody else&apos;s chatbot. Not a
              subscription that stops working the month you stop paying. If you
              want a large team, a procurement process and a 90-page proposal,
              there are excellent firms for that — we are deliberately not one.
            </p>
          </div>

          <aside className="about-side">
            <div className="side-card">
              <p className="eyebrow">At a glance</p>
              <dl className="side-list">
                <div>
                  <dt>Team</dt>
                  <dd>Two: design/build and systems/automation</dd>
                </div>
                <div>
                  <dt>Clients</dt>
                  <dd>Owner-run businesses, 2–50 people</dd>
                </div>
                <div>
                  <dt>Capacity</dt>
                  <dd>Two active builds at a time</dd>
                </div>
                <div>
                  <dt>Working hours</dt>
                  <dd>09:00–18:00 UK, async elsewhere</dd>
                </div>
                <div>
                  <dt>Stack</dt>
                  <dd>Next.js, Postgres, OpenAI/Anthropic, n8n, Make</dd>
                </div>
              </dl>
              <Link href="/contact" className="btn btn--sm side-btn" data-cta="about-book">
                Book an intro call
              </Link>
            </div>
          </aside>
        </div>

        <style>{`
          .about-grid { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: var(--s-8); align-items: start; }
          .about-main { max-width: 42rem; }
          .about-main > p:first-of-type { font-size: var(--step-1); color: var(--ink); line-height: 1.6; }
          .side-card {
            position: sticky;
            top: calc(var(--header-h) + 1.5rem);
            display: grid;
            gap: var(--s-4);
            padding: var(--s-5);
            border: 1px solid var(--rule);
            border-radius: var(--radius-lg);
            background: var(--paper-raised);
          }
          .side-list { display: grid; gap: .85rem; }
          .side-list > div { display: grid; gap: .15rem; padding-bottom: .85rem; border-bottom: 1px solid var(--rule); }
          .side-list > div:last-child { border-bottom: 0; padding-bottom: 0; }
          .side-list dt { font-family: var(--font-mono); font-size: var(--step--2); text-transform: uppercase; letter-spacing: .08em; color: var(--ink-faint); }
          .side-list dd { font-size: var(--step--1); color: var(--ink-soft); line-height: 1.45; }
          .side-btn { justify-content: center; }
          @media (max-width: 960px) {
            .about-grid { grid-template-columns: 1fr; }
            .side-card { position: static; }
          }
        `}</style>
      </section>

      <section className="section section--ink">
        <div className="wrap">
          <p className="eyebrow">How we decide</p>
          <h2 className="display" style={{ fontSize: "var(--step-4)", color: "var(--paper)", margin: ".6rem 0 var(--s-7)" }}>
            Four rules we do not break.
          </h2>
          <div className="principles">
            {principles.map((p) => (
              <div key={p.n} className="principle">
                <span className="mono">{p.n}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          .principles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: #2b2c22; border: 1px solid #2b2c22; }
          .principle { background: var(--ink); padding: var(--s-5); display: grid; gap: .6rem; align-content: start; }
          .principle .mono { color: var(--sage); font-size: var(--step--2); }
          .principle h3 { font-family: var(--font-display); font-size: var(--step-2); color: var(--paper); }
          .principle p { font-size: var(--step--1); color: #b8b3a2; line-height: 1.6; max-width: 40ch; }
          @media (max-width: 720px) { .principles { grid-template-columns: 1fr; } }
        `}</style>
      </section>

      <CTABand
        title="Sound like the right fit?"
        body="Twenty minutes, no pitch deck. You leave with a straight answer about what to do next, whether or not that involves us."
        cta="Book an intro call"
        href="/contact"
      />
    </>
  );
}
