import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import CTABand from "@/components/site/CTABand";
import JsonLd from "@/components/site/JsonLd";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { faqNode, graph, organizationNode, personNode, serviceNode, websiteNode } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Fixed-scope pricing for websites, AI agents and automation. UK and Australian small businesses. Setup from £1,450, care plans from £95 a month.",
  alternates: { canonical: "/pricing" },
};

type Tier = {
  id: string;
  name: string;
  best: string;
  setup: string;
  setupNote: string;
  monthly: string;
  monthlyNote: string;
  includes: string[];
  excludes?: string[];
  featured?: boolean;
  cta: string;
};

const tiers: Tier[] = [
  {
    id: "core",
    name: "Core",
    best: "For a business that needs a site that actually sells.",
    setup: "£1,450",
    setupNote: "one-off · or 3 × £520",
    monthly: "£95",
    monthlyNote: "care plan, optional",
    includes: [
      "5–7 page site, designed and built",
      "Copy structure and page wireframes",
      "Contact form with spam protection",
      "Speed and accessibility pass (90+ Lighthouse target)",
      "Technical SEO, sitemap, schema, Search Console",
      "Domain and email setup, SSL, backups",
      "Two rounds of revisions",
      "Launch training and written handover",
    ],
    cta: "Start with Core",
  },
  {
    id: "system",
    name: "System",
    best: "For the business that wants the phone answered, not just the website built.",
    setup: "£3,400",
    setupNote: "one-off · or 4 × £880",
    monthly: "£180",
    monthlyNote: "care plan, optional",
    includes: [
      "Everything in Core",
      "AI agent trained on your services and pricing",
      "Live chat plus WhatsApp or SMS channel",
      "Lead capture wired to your CRM or a simple one we set up",
      "Booking or callback flow with calendar sync",
      "Automated follow-up: day 2, day 7, close-the-loop",
      "Written escalation rules — when a human takes over",
      "30-day tuning window after launch",
      "Monthly report on enquiries and response times",
    ],
    featured: true,
    cta: "Start with System",
  },
  {
    id: "managed",
    name: "Managed",
    best: "For a team that wants someone accountable for the whole working system.",
    setup: "£5,900",
    setupNote: "one-off, scoped to your stack",
    monthly: "from £450",
    monthlyNote: "managed, monthly",
    includes: [
      "Everything in System",
      "Up to three automations connecting your existing tools",
      "Multi-site or multi-brand rollout",
      "Customer support agent with escalation and handoff",
      "Priority response and uptime monitoring",
      "Quarterly strategy call and roadmap",
      "Named contact, direct line",
    ],
    excludes: ["We do not resell software licences", "We do not take a cut of your ad spend"],
    cta: "Discuss Managed",
  },
];

const addons = [
  { name: "Extra page", price: "£140", note: "Per additional page beyond the included set" },
  { name: "Copywriting", price: "£90 / page", note: "Drafted by us, approved by you" },
  { name: "Extra language", price: "£450", note: "Full translation and layout pass" },
  { name: "Booking integration", price: "£320", note: "Calendly, Google Calendar or your CRM" },
  { name: "Websites for a second brand", price: "from £900", note: "Shared design system, separate content" },
  { name: "Rush delivery", price: "+35%", note: "When the launch date cannot move" },
];

const faqs = [
  {
    q: "Why is the agent not a £49-a-month subscription?",
    a: "Cheap per-seat bots are a commodity — you can buy one today. What you cannot buy is someone wiring it into your calendar, your CRM and your follow-up, testing it against real enquiries, and fixing it when it goes wrong. You are paying for the integration and the accountability, not the model.",
  },
  {
    q: "Do I own everything?",
    a: "Yes. Domain, hosting account, code repository, content, the agent's prompt library and every API key are in your name. If we part ways, you keep a working system and the documentation to run it.",
  },
  {
    q: "What if I only want the website?",
    a: "That is the Core tier. Plenty of clients stay there. We will not upsell an agent to a business that gets four enquiries a month and answers them the same day.",
  },
  {
    q: "How is this priced against the big agencies?",
    a: "UK digital agencies of any size tend to quote £8,000–£25,000 for a site and retainer, which prices out most owner-run businesses. We are deliberately below that, with a narrower scope and no account layer.",
  },
  {
    q: "Do you charge in other currencies?",
    a: "Australian clients are invoiced in AUD at a fixed rate agreed in writing. The reference points are A$2,750 for Core and A$6,400 for System — we do not add a currency-conversion surcharge.",
  },
  {
    q: "What is not included?",
    a: "Ad spend, third-party software licences, stock photography beyond the basic library, and legal drafting. We will not resell any of these at a markup.",
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={graph([
          organizationNode(),
          websiteNode(),
          personNode(),
          serviceNode({
            name: "Core website build",
            description:
              "A five to seven page website for an owner-run business, including design, build, forms, technical SEO and handover.",
            slug: "websites",
            fromPrice: 145000,
            currency: "GBP",
          }),
          serviceNode({
            name: "System — website with an AI agent",
            description:
              "The Core build plus an AI agent trained on your services, chat and WhatsApp, CRM wiring, booking and automated follow-up.",
            slug: "ai-agents",
            fromPrice: 340000,
            currency: "GBP",
          }),
          faqNode(
            faqs.map((f) => ({ q: f.q, a: f.a })),
            "/pricing"
          ),
        ])}
      />

      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Fixed scope.
            <br />
            <em>No hourly surprises.</em>
          </>
        }
        lede="Every quote is a written scope with a number on it. If the scope grows, you approve the change before any work happens. Prices are in GBP; Australian clients are invoiced in AUD."
        aside={
          <div className="hero-aside">
            <p className="mono tiny">Not sure which tier?</p>
            <p className="small">
              Book the call. We will tell you the smallest thing that fixes the
              problem.
            </p>
            <Link href="/contact" className="btn btn--sm" data-cta="pricing-book">
              Book a call
            </Link>
          </div>
        }
      />

      <div className="wrap" style={{ paddingTop: "1.25rem" }}>
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]}
        />
      </div>

      <section className="section section--tight">
        <div className="wrap">
          <div className="tier-grid">
            {tiers.map((t) => (
              <article key={t.id} className={`tier ${t.featured ? "tier--featured" : ""}`}>
                {t.featured && <span className="chip chip--cobalt tier-flag">Most chosen</span>}
                <h2 className="tier-name">{t.name}</h2>
                <p className="tier-best">{t.best}</p>

                <div className="tier-price">
                  <span className="mono tier-setup">{t.setup}</span>
                  <span className="tier-setup-note">{t.setupNote}</span>
                </div>
                <div className="tier-monthly">
                  <span className="mono">{t.monthly}</span>
                  <span>{t.monthlyNote}</span>
                </div>

                <ul className="tier-list">
                  {t.includes.map((i) => (
                    <li key={i}>
                      <span className="tick" aria-hidden="true">✓</span>
                      {i}
                    </li>
                  ))}
                  {t.excludes?.map((e) => (
                    <li key={e} className="tier-exclude">
                      <span className="cross" aria-hidden="true">—</span>
                      {e}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/start?plan=${t.id}`}
                  className={`btn ${t.featured ? "btn--cobalt" : "btn--ghost"} tier-cta`}
                  data-cta={`pricing-${t.id}`}
                >
                  {t.cta}
                </Link>
              </article>
            ))}
          </div>

          <p className="tiny muted pricing-foot">
            Prices exclude VAT where applicable. Payment is 50% to book the slot
            and 50% on launch. Care plans can be cancelled with 30 days&apos;
            notice; the system keeps working — you just stop getting us on the
            phone.
          </p>
        </div>

        <style>{`
          .tier-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--s-4);
            align-items: stretch;
          }
          .tier {
            position: relative;
            display: grid;
            grid-template-rows: auto auto auto auto 1fr auto;
            gap: .9rem;
            padding: clamp(1.4rem, 2.5vw, 2rem);
            background: var(--paper-raised);
            border: 1px solid var(--rule);
            border-radius: var(--radius-lg);
            align-content: start;
          }
          .tier--featured {
            border-color: var(--cobalt);
            box-shadow: 0 0 0 1px var(--cobalt), var(--shadow-lift);
          }
          .tier-flag { position: absolute; top: -0.8rem; left: 1.25rem; }
          .tier-name { font-family: var(--font-display); font-size: var(--step-3); letter-spacing: -.03em; }
          .tier-best { font-size: var(--step--1); color: var(--ink-mute); line-height: 1.5; min-height: 3.6em; }
          .tier-price { display: grid; gap: .1rem; padding-top: .5rem; border-top: 1px solid var(--rule); }
          .tier-setup { font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 400; letter-spacing: -.03em; }
          .tier-setup-note { font-size: var(--step--2); color: var(--ink-mute); }
          .tier-monthly { display: flex; align-items: baseline; gap: .5rem; font-size: var(--step--2); color: var(--ink-mute); }
          .tier-monthly .mono { color: var(--ink); font-size: var(--step-0); }
          .tier-list { display: grid; gap: .55rem; padding-top: 1rem; border-top: 1px solid var(--rule); }
          .tier-list li { display: grid; grid-template-columns: 1rem 1fr; gap: .55rem; font-size: var(--step--1); color: var(--ink-soft); line-height: 1.45; }
          .tick { color: #4d7a3a; font-size: .8rem; }
          .tier-exclude { color: var(--ink-faint); }
          .cross { color: var(--ink-faint); }
          .tier-cta { justify-content: center; align-self: end; }
          .pricing-foot { margin-top: var(--s-5); max-width: 62ch; line-height: 1.6; }

          @media (max-width: 980px) {
            .tier-grid { grid-template-columns: 1fr; max-width: 34rem; margin-inline: auto; }
            .tier-best { min-height: 0; }
          }
        `}</style>
      </section>

      <section className="section section--raised section--border">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Add-ons</p>
              <h2 style={{ marginTop: ".6rem" }}>If you need it, it has a price.</h2>
            </div>
            <p className="muted small" style={{ maxWidth: "28ch" }}>
              Anything not on this list is quoted separately, in writing, before
              work starts.
            </p>
          </div>

          <div className="table-scroll">
            <table className="table addon-table">
              <thead>
                <tr>
                  <th scope="col">Add-on</th>
                  <th scope="col" className="num">Price</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {addons.map((a) => (
                  <tr key={a.name}>
                    <td><strong>{a.name}</strong></td>
                    <td className="num">{a.price}</td>
                    <td className="muted">{a.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap faq-wrap">
          <div className="faq-intro">
            <p className="eyebrow">Questions</p>
            <h2 className="display" style={{ fontSize: "var(--step-4)", marginTop: ".6rem" }}>
              The ones worth answering up front.
            </h2>
            <p className="muted small" style={{ marginTop: "1rem" }}>
              Still unclear?{" "}
              <Link href="/contact" className="text-link">Ask directly.</Link>
            </p>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <details key={f.q} className="faq" open={i === 0}>
                <summary>
                  <span>{f.q}</span>
                  <span className="faq-marker" aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <style>{`
          .faq-wrap { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.4fr); gap: var(--s-8); align-items: start; }
          .faq-intro { position: sticky; top: calc(var(--header-h) + 2rem); }
          .faq-list { border-top: 1px solid var(--rule-strong); }
          .faq { border-bottom: 1px solid var(--rule); }
          .faq summary {
            display: flex;
            justify-content: space-between;
            gap: 1.5rem;
            align-items: center;
            padding: 1.15rem 0;
            cursor: pointer;
            list-style: none;
            font-size: var(--step-0);
            font-weight: 550;
          }
          .faq summary::-webkit-details-marker { display: none; }
          .faq-marker {
            width: 12px;
            height: 12px;
            position: relative;
            flex: none;
          }
          .faq-marker::before,
          .faq-marker::after {
            content: "";
            position: absolute;
            background: var(--cobalt);
            transition: transform var(--dur) var(--ease);
          }
          .faq-marker::before { inset: 5.5px 0; height: 1.5px; }
          .faq-marker::after { inset: 0 5.5px; width: 1.5px; }
          .faq[open] .faq-marker::after { transform: scaleY(0); }
          .faq p { padding: 0 2rem 1.25rem 0; color: var(--ink-mute); font-size: var(--step--1); line-height: 1.7; max-width: 62ch; }
          @media (max-width: 900px) {
            .faq-wrap { grid-template-columns: 1fr; gap: var(--s-5); }
            .faq-intro { position: static; }
          }
        `}</style>
      </section>

      <CTABand
        title="Two projects a month. That is the cap."
        body="It keeps the work good and the reply time short. If the current month is full, you get the next slot with a date, not a maybe."
        cta="Claim a slot"
        href="/contact"
        secondary="Read the FAQ"
        secondaryHref="/faq"
      />
    </>
  );
}
