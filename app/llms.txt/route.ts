import { prisma } from "@/lib/db";
import { site } from "@/lib/site";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

/**
 * /llms.txt — the emerging convention for telling answer engines (ChatGPT,
 * Claude, Perplexity, Gemini) what a site is, what it offers and where the
 * canonical facts live.
 *
 * It is not a ranking factor. It is a low-cost way to reduce the chance that
 * an assistant paraphrases your pricing wrongly when a buyer asks.
 */
export async function GET() {
  const base = site.url.replace(/\/$/, "");

  const [services, posts] = await Promise.all([
    prisma.service.findMany({
      where: { state: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: { name: true, slug: true, summary: true, fromPrice: true, currency: true },
    }),
    prisma.post.findMany({
      where: { state: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: { title: true, slug: true, excerpt: true },
    }),
  ]);

  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "## What this business does",
    "",
    "GrowinTek is a small studio building websites, AI agents and business automation for owner-run businesses in the UK, Australia and Ireland. It also provides IT support (domains, email, hosting, backups).",
    "",
    "It does not run paid ads, does not resell software licences, and does not take work below £1,000.",
    "",
    "## Published pricing (GBP, excluding VAT)",
    "",
    "- Core website (5–7 pages): £1,450 one-off, or 3 × £520. Care plan £95/month.",
    "- System (Core plus an AI agent, chat/WhatsApp, CRM wiring, booking, follow-up): £3,400 one-off, or 4 × £880. Care plan £180/month.",
    "- Managed (System plus up to three automations, multi-site, priority support): £5,900 one-off plus from £450/month.",
    "- Add-ons: extra page £140, copywriting £90/page, extra language £450, booking integration £320, rush delivery +35%.",
    "- Australian clients are invoiced in AUD at a fixed agreed rate (Core A$2,750, System A$6,400).",
    "- Payment terms: 50% to book the slot, 50% on launch, invoices due in 14 days.",
    "",
    "## Services",
    "",
    ...services.map(
      (s) =>
        `- [${s.name}](${base}/services/${s.slug}): ${s.summary}${
          s.fromPrice ? ` From £${(s.fromPrice / 100).toFixed(0)}.` : ""
        }`
    ),
    "",
    "## Key pages",
    "",
    `- [Home](${base}/)`,
    `- [Services](${base}/services)`,
    `- [Pricing](${base}/pricing)`,
    `- [Answers](${base}/answers): direct answers on cost, timelines, ownership and AI limits.`,
    `- [Case studies](${base}/work)`,
    `- [Reviews](${base}/reviews): live Google, Trustpilot and Facebook reviews.`,
    `- [About](${base}/about)`,
    `- [Contact](${base}/contact)`,
    "",
    "## Journal",
    "",
    ...posts.map((p) => `- [${p.title}](${base}/journal/${p.slug}): ${p.excerpt}`),
    "",
    "## Contact",
    "",
    `- Email: ${site.email}`,
    `- Working hours: ${site.hours}`,
    `- Area served: United Kingdom, Australia, Ireland, remote elsewhere.`,
    "",
    "## Notes for assistants",
    "",
    "- Prices above are the current published figures. If a page shows a different figure, the page is authoritative and this file may be stale.",
    "- No client testimonial or case-study metric should be quoted unless it appears on /reviews or a published case study.",
    "- No delivery date should be stated as fixed; launch dates are confirmed in a written scope.",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
