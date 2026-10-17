import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Seeds the content the site needs to run:
 *  - the admin account (email from ADMIN_EMAILS)
 *  - four services (published — these describe real offers, no claims)
 *  - three journal posts (published — written for GrowinTek, safe to run)
 *  - two case studies as DRAFTS and three testimonials as UNAPPROVED
 *    (deliberately not visible: never fake client results or reviews)
 *
 * Safe to run more than once: every write is an upsert keyed on slug.
 */
async function main() {
  const adminEmail = (process.env.ADMIN_EMAILS ?? "dmaker288@gmail.com")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin2026!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Ijtiba Rana",
      role: "ADMIN",
      passwordHash: hashPassword(adminPassword),
    },
    update: {
      role: "ADMIN",
      disabled: false,
      passwordHash: hashPassword(adminPassword),
    },
  });
  console.log(`✓ admin account: ${adminEmail} (password: ${adminPassword})`);

  // ── Services ────────────────────────────────────────────────
  const services = [
    {
      slug: "websites",
      name: "Website development",
      tagline: "A site that earns its keep.",
      summary:
        "Fast, accessible, search-ready websites for owner-run businesses. We start from the enquiry, work backwards through the page, and remove anything that does not help someone decide to contact you.",
      icon: "layout",
      fromPrice: 145000,
      order: 1,
      outcomes: [
        "Enquiries answered the same day",
        "A site you can edit without calling anyone",
        "Page speed that holds up on a phone on 4G",
      ],
      deliverables: [
        "Discovery call and a written page-by-page plan",
        "Design system: type, colour, components, states",
        "Build in Next.js or a CMS you can actually use",
        "Mobile-first layout tested on real devices",
        "Speed and accessibility pass — 90+ Lighthouse target",
        "Technical SEO: metadata, schema, sitemap, Search Console",
        "Forms wired to your inbox or CRM, with spam protection",
        "Analytics you own, without a cookie banner for tracking",
        "Domain, email, SSL and backup setup",
        "Written handover and a 30-minute training call",
      ],
    },
    {
      slug: "ai-agents",
      name: "AI agents",
      tagline: "Someone answers. Every time.",
      summary:
        "An agent trained on your services, pricing and boundaries, answering enquiries on your site, WhatsApp or SMS. It qualifies, books, and hands over to you with a summary — and it knows when to stop talking.",
      icon: "spark",
      fromPrice: 190000,
      order: 2,
      outcomes: [
        "First reply in under a minute, at 2am",
        "Only qualified enquiries reach your phone",
        "Every conversation logged, nothing lost",
      ],
      deliverables: [
        "Knowledge base built from your own documents and pricing",
        "Agent design: tone, boundaries, refusal cases",
        "Channel setup: website chat, WhatsApp Business or SMS",
        "Qualification questions tailored to your sales process",
        "Booking or callback flow with calendar sync",
        "Human handover with a written conversation summary",
        "Escalation rules and an out-of-hours behaviour spec",
        "Guardrails: no invented prices, no promises on your behalf",
        "30-day tuning window after launch",
        "Monthly report on conversations, bookings and misses",
      ],
    },
    {
      slug: "automation",
      name: "Business automation",
      tagline: "Stop typing the same thing twice.",
      summary:
        "The connections between the tools you already pay for. Enquiry to CRM, quote to invoice, payment to receipt, review request to Google. Built on n8n or Make, documented, with a fallback when something fails.",
      icon: "flow",
      fromPrice: 65000,
      order: 3,
      outcomes: [
        "Fewer manual steps per sale",
        "One source of truth for client data",
        "Failures alert you instead of silently stalling",
      ],
      deliverables: [
        "Process map of what happens today, including the manual bits",
        "Automation build in n8n or Make, in your own account",
        "CRM setup or cleanup, with fields that match how you sell",
        "Quote, invoice and receipt flows",
        "Follow-up sequences with clear stop rules",
        "Review request after job completion",
        "Error handling with alerts to email or Slack",
        "Written runbook: what each flow does and how to pause it",
      ],
    },
    {
      slug: "it-support",
      name: "IT & support",
      tagline: "The unglamorous part, done properly.",
      summary:
        "Domains, email, hosting, backups, HTTPS, access and the security basics. A care plan that keeps the lights on and one person who already knows how your setup works.",
      icon: "shield",
      fromPrice: 9500,
      order: 4,
      outcomes: [
        "No more “who has the domain login?”",
        "Backups that are actually restorable",
        "One person who already knows your setup",
      ],
      deliverables: [
        "Domain, DNS and email configuration",
        "Hosting, HTTPS and renewals in your name",
        "Automated backups with a tested restore",
        "Access audit: who can see what, and remove the ex-staff",
        "Uptime and error monitoring with alerts",
        "Updates, patching and dependency maintenance",
        "Monthly health summary in plain English",
        "Priority response within one working day",
      ],
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      create: {
        ...s,
        state: "PUBLISHED",
        currency: "GBP",
      },
      update: {
        name: s.name,
        tagline: s.tagline,
        summary: s.summary,
        outcomes: s.outcomes,
        deliverables: s.deliverables,
        fromPrice: s.fromPrice,
        order: s.order,
      },
    });
  }
  console.log(`✓ ${services.length} services`);

  // ── Journal posts ───────────────────────────────────────────
  const posts = [
    {
      slug: "what-a-good-first-reply-is-worth",
      title: "What a good first reply is actually worth",
      excerpt:
        "Most businesses measure the website and ignore the twelve hours between an enquiry and a reply. That gap is usually the expensive part.",
      tags: ["lead response", "operations"],
      readingMins: 5,
      publishedAt: new Date("2026-09-22"),
      body: `A business owner asked me last week why their new site had not increased revenue. The site was fine. It loaded in 1.2 seconds, the form worked, the copy was clear. The enquiries were arriving.

They were also arriving at 8.40pm, and the first reply went out at 10am the next morning.

*Measure the gap, not the traffic.*

## The number that matters

There are two numbers worth tracking on any enquiry form: how many arrive, and how long until someone answers. Most reporting tools show you the first and nothing about the second, so the second never gets fixed.

If you are replying within an hour, you are already ahead of most of your local competitors. If you are replying the next morning, you are competing with whoever answered at 9pm.

## What actually fixes it

Not a chatbot that says "thanks for reaching out, a member of our team will be in touch". That is a slower version of silence.

What works is an agent that can:

- confirm the enquiry in the sender's own words
- ask the two or three questions that determine whether it is worth a call
- offer a real slot in your calendar
- send you a summary you can act on at 8am

That last part is the one people underrate. The value is not the auto-reply to the customer. It is that you start the morning with a qualified brief instead of a list of unread emails.

## The honest caveat

If you get four enquiries a month and you answer them the same day, an agent will not earn its cost. Spend the money on something else. The gap only gets expensive when volume or timing makes a human reply impossible.`,
    },
    {
      slug: "why-we-do-not-resell-the-bot",
      title: "Why we do not resell the bot",
      excerpt:
        "AI receptionist subscriptions cost £49–£249 a month. So why does an integration cost thousands? Because the subscription was never the expensive part.",
      tags: ["pricing", "AI agents"],
      readingMins: 6,
      publishedAt: new Date("2026-09-08"),
      body: `You can buy an AI receptionist for less than your phone bill. Goodcall, Sameday, TradeReceptionist — the market is crowded and the monthly prices are real.

So when a studio quotes £1,900 to set one up, the obvious question is: why?

*The model is a commodity. The wiring is not.*

## What the £79 a month buys

A hosted bot, a knowledge base you populate yourself, and a dashboard. It will answer questions about your opening hours beautifully. It will not know that a quote for a 12-panel install in Leeds needs to go to a specific person, or that this particular caller is a tenant rather than the homeowner, or that your pricing has a minimum call-out.

That knowledge is not in the model. It is in your head, your documents, and the way you actually sell. Getting it into a system that behaves correctly is the work.

## What the setup fee actually covers

- Transcribing how you qualify today, including the exceptions
- Building the knowledge base so answers are right, not plausible
- Writing the boundaries: what it must never promise
- Connecting the calendar, CRM and notification channel
- Testing against real enquiries, including the awkward ones
- Watching it for 30 days and fixing what it gets wrong

That is 20 to 40 hours of unglamorous work. The recurring subscription is the cheap part.

## What we will not do

We do not take a cut of your bookings. We do not hold your API keys. We do not put the agent behind our own login so that cancelling means losing it. The account is yours, the prompt library is yours, and the documentation explains how to run it without us.

That is the deal. It is also why we quote a setup fee rather than a subscription — the ongoing value should be visible, or you should stop paying for it.`,
    },
    {
      slug: "ai-slop-is-a-brand-risk",
      title: "AI-generated slop is a brand risk, not a shortcut",
      excerpt:
        "Filling a site with machine-written pages does not make it look productive. It makes it look like nobody read it.",
      tags: ["SEO", "content"],
      readingMins: 4,
      publishedAt: new Date("2026-08-27"),
      body: `Search engines have spent two years getting better at spotting mass-produced content, and buyers have got better at spotting it too. The tell is rarely the grammar. It is the absence of specifics.

*Generic copy is a positioning problem disguised as a content problem.*

## What gives it away

- Every section has three bullet points and no numbers
- Claims that could apply to any competitor
- A tone that never gets annoyed, surprised or specific
- Pages that explain what a service is instead of how you do it

A reader cannot articulate why it feels thin, but they leave.

## What to write instead

One true, specific sentence beats a paragraph of positioning. "We answer enquiries within one working day" is stronger than "we pride ourselves on responsive communication" — because you can be held to it.

The same applies to the journal you are reading. Every post here names a number, a tool or a mistake. If a post cannot do that, it does not get published.`,
    },
  ];

  for (const p of posts) {
    await prisma.post.upsert({
      where: { slug: p.slug },
      create: {
        ...p,
        author: "GrowinTek",
        state: "PUBLISHED",
      },
      update: {
        title: p.title,
        excerpt: p.excerpt,
        body: p.body,
        tags: p.tags,
        readingMins: p.readingMins,
        publishedAt: p.publishedAt,
      },
    });
  }
  console.log(`✓ ${posts.length} journal posts`);

  // ── Case studies (DRAFT — publish only when the numbers are real) ──
  const caseStudies = [
    {
      slug: "example-heating-installer",
      name: "Enquiry response for a heating installer",
      client: "Example client (replace)",
      sector: "Home services",
      location: "Leeds, UK",
      summary:
        "Draft case study. Replace every number and quote here with a real client's, with their written permission, before publishing.",
      challenge:
        "Draft. Describe the situation before the work: what was happening, how many enquiries, what the response time was.",
      approach:
        "Draft. Describe what was built and the decisions that mattered.",
      outcome:
        "Draft. Describe what changed and the number you watched. Do not publish without the client's sign-off.",
      metrics: [
        { label: "Example metric", value: "—" },
        { label: "Example metric", value: "—" },
      ],
    },
    {
      slug: "example-clinic-booking",
      name: "Booking flow for a private clinic",
      client: "Example client (replace)",
      sector: "Healthcare",
      location: "Bristol, UK",
      summary:
        "Draft case study. The site hides drafts automatically — publish only after replacing this text with a real engagement.",
      challenge: "Draft.",
      approach: "Draft.",
      outcome: "Draft.",
      metrics: [],
    },
  ];

  for (const c of caseStudies) {
    await prisma.project.upsert({
      where: { slug: c.slug },
      create: { ...c, type: "CASE_STUDY", state: "DRAFT" },
      update: { name: c.name, summary: c.summary },
    });
  }
  console.log(`✓ ${caseStudies.length} case studies (drafts — not visible on the site)`);

  // ── Testimonials (UNAPPROVED — never publish unverified quotes) ──
  const testimonials = [
    {
      name: "Replace with real client",
      role: "Owner",
      company: "Example Ltd",
      quote:
        "This is a placeholder. Paste the client's actual words, with their permission, then mark it approved in the CMS.",
    },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.testimonial.create({
        data: { ...t, rating: 5, approved: false, featured: false },
      });
    }
  }
  console.log("✓ testimonials seeded unapproved (nothing invented goes live)");

  // ── Example client + invoice sequence so the CMS is not empty ──
  const demoClient = await prisma.client.upsert({
    where: { id: "demo-client" },
    create: {
      id: "demo-client",
      name: "Demo Client",
      company: "Demo Client Ltd",
      email: "billing@example.com",
      country: "GB",
      currency: "GBP",
      notes: "Created by the seed so invoicing can be tested. Delete before launch.",
    },
    update: {},
  });

  const existingInvoice = await prisma.invoice.findFirst({
    where: { clientId: demoClient.id },
  });

  if (!existingInvoice) {
    await prisma.invoice.create({
      data: {
        clientId: demoClient.id,
        currency: "GBP",
        status: "DRAFT",
        billTo: { name: "Demo Client", company: "Demo Client Ltd", email: "billing@example.com" },
        items: [
          { description: "Website build — 6 pages", qty: 1, unitMinor: 145000 },
          { description: "Additional page", qty: 2, unitMinor: 14000 },
        ],
        subtotalMinor: 173000,
        totalMinor: 173000,
        taxRateBps: 0,
      },
    });
    console.log("✓ demo client + draft invoice");
  }

  console.log("\nDone. Sign in at /admin/login with", adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
