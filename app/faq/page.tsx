import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import CTABand from "@/components/site/CTABand";
import JsonLd from "@/components/site/JsonLd";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { faqNode, graph, organizationNode, personNode, websiteNode } from "@/lib/schema";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Straight answers about pricing, ownership, timelines and what happens after launch.",
  alternates: { canonical: "/faq" },
};

const groups = [
  {
    title: "Working together",
    items: [
      {
        q: "How quickly can you start?",
        a: "Two builds run at once, so the wait is usually one to three weeks. Once a slot is booked, discovery starts the same week and the first demo lands within seven days.",
      },
      {
        q: "Who will I actually talk to?",
        a: "The person doing the work. There is no account manager relaying messages — that is one reason the overhead is lower than a larger agency.",
      },
      {
        q: "Do you work with businesses outside the UK and Australia?",
        a: "Yes, anywhere with a reasonable time-zone overlap. Most of the UK and Australia is workable; US west coast is harder for calls but fine for async work.",
      },
      {
        q: "What do you need from me?",
        a: "Access to your domain and hosting, honest answers about how you sell, and a decision-maker who can approve scope. Content can be drafted by us, but it needs your sign-off.",
      },
    ],
  },
  {
    title: "Money",
    items: [
      {
        q: "How do payments work?",
        a: "Fifty per cent to book the slot and start, fifty per cent on launch. Invoices are due in 14 days. Larger projects can be split across milestones.",
      },
      {
        q: "Are there ongoing costs?",
        a: "Yes, but they go to the vendors, not to us: hosting (typically £0–£25 a month), the database (Prisma Postgres, usually free to start) and any AI model usage. Those accounts are in your name. Our care plan is a separate, optional fee.",
      },
      {
        q: "Why not just charge a low monthly fee for the agent?",
        a: "Because the recurring fee hides the real dependency. We quote setup, put everything in your name, and let the care plan earn its renewal each month. If we stop being useful, you can stop paying.",
      },
      {
        q: "Do you offer a refund?",
        a: "If work has not started, yes — the booking deposit is returned minus any third-party costs already incurred. Once build work has begun, the deposit covers the hours already worked.",
      },
    ],
  },
  {
    title: "After launch",
    items: [
      {
        q: "What if something breaks?",
        a: "Care plan clients get priority response within one working day. If you are not on a plan, you can still book ad-hoc work, though it goes to the back of the queue.",
      },
      {
        q: "Can I edit the site myself?",
        a: "Yes. The CMS covers posts, services, case studies, testimonials and media. You get a written guide and a short training call. Changing layout is a development job, not a content one — that is deliberate, so the design cannot drift.",
      },
      {
        q: "What happens to the AI agent if I cancel the care plan?",
        a: "It keeps running. The accounts, prompts and integrations are yours. You would need to maintain them or hire someone — the documentation explains how.",
      },
      {
        q: "Do you do SEO and ads?",
        a: "Technical SEO is part of every build: metadata, schema, sitemap, speed, Search Console. We do not run paid ads. If you want a PPC manager, we will point you at people we trust rather than take a cut.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={graph([
          organizationNode(),
          websiteNode(),
          personNode(),
          faqNode(
            groups.flatMap((g) => g.items).map((f) => ({ q: f.q, a: f.a })),
            "/faq"
          ),
        ])}
      />

      <PageHero
        eyebrow="FAQ"
        title={
          <>
            The questions
            <br />
            <em>we actually get.</em>
          </>
        }
        lede="No filler answers. If something here contradicts what another studio told you, that is worth asking about."
      />

      <section className="section section--tight">
        <div className="wrap faq-page">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "FAQ", path: "/faq" },
            ]}
          />
          {groups.map((g) => (
            <div key={g.title} className="faq-group">
              <h2 className="faq-group-title">{g.title}</h2>
              <div className="faq-page-list">
                {g.items.map((f) => (
                  <details key={f.q} className="faq">
                    <summary>
                      <span>{f.q}</span>
                      <span className="faq-marker" aria-hidden="true" />
                    </summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <p className="muted small" style={{ marginTop: "2rem" }}>
            Still stuck? <Link href="/contact" className="text-link">Ask directly</Link> — it
            will be answered, not filtered.
          </p>
        </div>

        <style>{`
          .faq-page { max-width: 52rem; }
          .faq-group + .faq-group { margin-top: 2.5rem; }
          .faq-group-title { font-family: var(--font-display); font-size: var(--step-3); margin-bottom: 1rem; }
          .faq-page-list { border-top: 1px solid var(--rule-strong); }
          .faq { border-bottom: 1px solid var(--rule); }
          .faq summary {
            display: flex;
            justify-content: space-between;
            gap: 1.5rem;
            align-items: center;
            padding: 1.1rem 0;
            cursor: pointer;
            list-style: none;
            font-size: var(--step-0);
            font-weight: 550;
          }
          .faq summary::-webkit-details-marker { display: none; }
          .faq-marker { width: 12px; height: 12px; position: relative; flex: none; }
          .faq-marker::before, .faq-marker::after {
            content: ""; position: absolute; background: var(--cobalt);
            transition: transform var(--dur) var(--ease);
          }
          .faq-marker::before { inset: 5.5px 0; height: 1.5px; }
          .faq-marker::after { inset: 0 5.5px; width: 1.5px; }
          .faq[open] .faq-marker::after { transform: scaleY(0); }
          .faq p { padding: 0 2rem 1.25rem 0; color: var(--ink-mute); font-size: var(--step--1); line-height: 1.7; }
        `}</style>
      </section>

      <CTABand
        title="Ask the awkward one."
        body="If there is a question this page dodged, that is usually the one worth a call."
        cta="Book an intro call"
        href="/contact"
        secondary="See pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}
