import type { Metadata } from "next";
import Link from "next/link";
import CTABand from "@/components/site/CTABand";
import JsonLd from "@/components/site/JsonLd";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import {
  faqNode,
  graph,
  organizationNode,
  personNode,
  websiteNode,
} from "@/lib/schema";

export const metadata: Metadata = {
  title: "Answers",
  description:
    "Direct answers to the questions buyers ask before hiring a web and AI automation studio: what it costs, how long it takes, who owns the code, and what happens when the model is wrong.",
  alternates: { canonical: "/answers" },
  openGraph: {
    title: "Answers — GrowinTek",
    description:
      "Short, specific answers about websites, AI agents, pricing and ownership. No sales copy.",
    url: "/answers",
  },
};

/**
 * Answer-engine page. Written for humans first, but structured so an answer
 * engine can lift a single question and a complete answer without guessing.
 * Every answer is self-contained: no "as mentioned above".
 */
const ANSWERS: { question: string; answer: string; detail: string[] }[] = [
  {
    question: "How much does a small business website cost in the UK in 2026?",
    answer:
      "A five to seven page business site built by a small studio is typically £1,450 to £4,000 in the UK. GrowinTek charges £1,450 for its Core build, which includes design, build, forms, technical SEO, domain and email setup, and a handover. Agencies quote £8,000 and up for similar scope.",
    detail: [
      "What moves the price: page count, copywriting, booking or CRM integration, and how quickly you need it. An extra page is £140; copywriting is £90 a page; a booking integration is £320.",
      "What should not cost extra: speed optimisation, basic accessibility, metadata, a sitemap and a contact form. A studio that bills those separately is padding the invoice.",
      "Australian clients are quoted in AUD; GrowinTek's Core build is A$2,750 at the time of writing.",
    ],
  },
  {
    question: "How much does an AI receptionist or AI agent cost for a small business?",
    answer:
      "Hosted AI receptionist subscriptions run from about £49 to £250 a month in the UK and $79 to $789 a month internationally. A custom-built agent wired into your calendar, CRM and follow-up costs £1,900 to £3,500 as a one-off setup plus around £180 a month for maintenance. The setup is the expensive part because the work is integration, not the model.",
    detail: [
      "A subscription gives you a hosted bot with a knowledge base you populate yourself. It will answer questions about opening hours reliably; it will not know your quoting rules, your minimum call-out, or who should receive a specific type of job.",
      "The setup fee covers transcribing how you qualify enquiries, writing the agent's boundaries, connecting the calendar and CRM, testing against awkward real enquiries, and 30 days of tuning.",
      "If you get four enquiries a month and answer them the same day, an agent will not earn its cost. Buy a better website instead.",
    ],
  },
  {
    question: "How long does an AI agent take to build?",
    answer:
      "A working pilot takes 10 to 15 working days after the discovery call. That covers the knowledge base, channel setup, qualification questions, booking or callback flow, escalation rules and testing. A 30-day tuning window follows launch.",
    detail: [
      "The bottleneck is rarely the model. It is getting your pricing, boundaries and escalation rules out of your head and into a document the agent can follow.",
      "If your CRM is a spreadsheet with no consistent fields, expect an extra week to clean it up before the agent can write to it.",
    ],
  },
  {
    question: "Who owns the website and the AI agent when the project ends?",
    answer:
      "You do. GrowinTek creates the domain, hosting account, repository, database and AI model accounts in the client's name, and hands over the agent's prompt library and documentation. There is no lock-in and no monthly fee required to keep the system running.",
    detail: [
      "Open-source components remain under their own licences, and third-party tools remain subject to their providers' terms.",
      "The care plan is optional. Cancelling it stops the maintenance; it does not disable the site or the agent.",
    ],
  },
  {
    question: "How do you stop an AI agent from giving wrong prices or making promises?",
    answer:
      "By grounding the agent in a fixed context block built from the published services and prices, and by writing explicit boundaries into its instructions. It is told never to invent a price, a case study or a delivery date, and to escalate to a human with a written summary when a question falls outside that context. Every conversation is logged so mistakes can be found and corrected.",
    detail: [
      "Testing happens against real enquiries, including the awkward ones: someone asking for a discount, someone who is a tenant rather than the homeowner, someone asking for a service you do not offer.",
      "No AI agent can be guaranteed correct in every situation. That is why every build includes a human handover path and a monthly report on conversations, bookings and misses.",
    ],
  },
  {
    question: "Can I edit my own website after launch?",
    answer:
      "Yes, for content. GrowinTek sites include a content management area for journal posts, services, case studies, testimonials and media, plus a five-minute guide and a training call. Changing layout or adding a new page type is a development task — that is deliberate, so the design cannot drift after launch.",
    detail: [
      "If you need unlimited layout freedom, a page builder such as WordPress is a better fit, and GrowinTek will say so.",
      "If you want a site that stays fast and consistent, a constrained editor is the point, not a limitation.",
    ],
  },
  {
    question: "Do you work with businesses outside the UK?",
    answer:
      "Yes. GrowinTek works with clients in the UK, Australia and Ireland, and takes projects elsewhere where the time-zone overlap is workable. Australian clients are invoiced in AUD at a fixed agreed rate.",
    detail: [
      "Calls are scheduled in your time zone. Work is delivered asynchronously with a weekly demo of the build in progress.",
      "Cold outreach rules differ by country, which is why GrowinTek does not send unsolicited messages in Germany or Canada.",
    ],
  },
  {
    question: "What is included in a monthly care plan?",
    answer:
      "Care plans start at £95 a month and cover hosting and renewal management, automated backups with a tested restore, uptime and error monitoring, updates and patching, a monthly health summary, and priority response within one working day. System and Managed plans add agent monitoring, report reviews and tuning.",
    detail: [
      "Care plans do not cover new features, third-party price increases, or breakage caused by changes made outside the plan.",
      "Plans are monthly and cancellable with 30 days' notice.",
    ],
  },
];

export default function AnswersPage() {
  return (
    <>
      <JsonLd
        data={graph([
          organizationNode(),
          websiteNode(),
          personNode(),
          faqNode(
            ANSWERS.map((a) => ({ q: a.question, a: a.answer })),
            "/answers"
          ),
        ])}
      />

      <section className="answers-hero">
        <div className="wrap wrap--narrow">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Answers", path: "/answers" },
            ]}
          />
          <p className="eyebrow eyebrow--cobalt">Answers</p>
          <h1 className="display answers-title">
            The questions buyers
            <br />
            <em>actually ask.</em>
          </h1>
          <p className="lede">
            Short, specific answers about cost, timelines, ownership and what happens
            when an AI agent gets something wrong. Written to be read in two minutes,
            and quoted without losing the meaning.
          </p>
          <p className="tiny muted answers-meta">
            Published {new Date().getFullYear()} · Reviewed by{" "}
            <Link href="/about" className="text-link">Ijtiba Rana</Link>, GrowinTek
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap wrap--narrow">
          <ol className="answers">
            {ANSWERS.map((a, i) => (
              <li key={a.question} className="answer" id={`q${i + 1}`}>
                <h2 className="answer-q">
                  <span className="mono answer-num">{String(i + 1).padStart(2, "0")}</span>
                  {a.question}
                </h2>
                <p className="answer-a">{a.answer}</p>
                <ul className="answer-detail">
                  {a.detail.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <div className="answers-foot">
            <p className="small muted">
              Something missing? Ask the assistant in the corner, or{" "}
              <Link href="/contact" className="text-link">send the question directly</Link>.
              Answers here are updated when the underlying facts change, and the date
              above changes with them.
            </p>
          </div>
        </div>

        <style>{`
          .answers-hero { padding-block: clamp(2rem, 5vw, 4rem) var(--s-6); border-bottom: 1px solid var(--rule); }
          .answers-title { font-size: var(--step-5); letter-spacing: -.035em; margin: .6rem 0 var(--s-4); }
          .answers-meta { margin-top: var(--s-4); }

          .answers { display: grid; gap: var(--s-7); counter-reset: answer; }
          .answer { display: grid; gap: var(--s-3); padding-bottom: var(--s-6); border-bottom: 1px solid var(--rule); }
          .answer:last-child { border-bottom: 0; padding-bottom: 0; }
          .answer-q {
            display: grid;
            grid-template-columns: 2.5rem 1fr;
            gap: .5rem;
            align-items: baseline;
            font-family: var(--font-display);
            font-size: var(--step-3);
            letter-spacing: -.025em;
            line-height: 1.15;
            scroll-margin-top: calc(var(--header-h) + 2rem);
          }
          .answer-num { font-family: var(--font-mono); font-size: var(--step--2); color: var(--cobalt); }
          .answer-a {
            grid-column: 2;
            font-size: var(--step-1);
            line-height: 1.55;
            color: var(--ink);
            max-width: 62ch;
          }
          .answer-detail {
            grid-column: 2;
            display: grid;
            gap: .5rem;
            max-width: 62ch;
            margin-top: .3rem;
          }
          .answer-detail li {
            position: relative;
            padding-left: 1.2rem;
            font-size: var(--step--1);
            line-height: 1.65;
            color: var(--ink-mute);
          }
          .answer-detail li::before {
            content: "";
            position: absolute;
            left: 0;
            top: .72em;
            width: .5rem;
            height: 1px;
            background: var(--cobalt);
          }
          .answers-foot { margin-top: var(--s-7); padding-top: var(--s-5); border-top: 1px solid var(--rule-strong); }

          @media (max-width: 620px) {
            .answer-q { grid-template-columns: 1fr; gap: .3rem; font-size: var(--step-2); }
            .answer-a, .answer-detail { grid-column: 1; }
          }
        `}</style>
      </section>

      <CTABand
        title="Still deciding?"
        body="The intro call is twenty minutes and covers the specific numbers for your situation, not the ranges on this page."
        cta="Book an intro call"
        href="/contact"
        secondary="See pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}
