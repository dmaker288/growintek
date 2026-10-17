import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat, aiConfigured, type ChatMessage } from "@/lib/ai";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMinor } from "@/lib/money";
import { buildSiteContext } from "@/lib/agent-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

/**
 * The internal assistant. Same model, different job: it has the CMS data and
 * answers questions about the business rather than selling to visitors.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  if (!aiConfigured()) {
    return NextResponse.json({ error: "No AI provider configured." }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Malformed request." }, { status: 422 });
  }

  const [siteContext, leads, invoices, projects] = await Promise.all([
    buildSiteContext(),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { name: true, company: true, service: true, budget: true, status: true, message: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["SENT", "OVERDUE"] } },
      orderBy: { dueAt: "asc" },
      take: 15,
      select: { number: true, status: true, totalMinor: true, amountPaidMinor: true, currency: true, dueAt: true, client: { select: { name: true } } },
    }),
    prisma.clientProject.findMany({
      where: { status: { not: "CLOSED" } },
      take: 15,
      select: { name: true, status: true, dueAt: true, client: { select: { name: true } } },
    }),
  ]);

  const pipeline = leads.length
    ? leads
        .map(
          (l) =>
            `- ${l.name}${l.company ? ` (${l.company})` : ""} · ${l.service ?? "unspecified"} · budget ${l.budget ?? "unknown"} · status ${l.status.toLowerCase()} · received ${l.createdAt.toISOString().slice(0, 10)}\n  Brief: ${l.message.slice(0, 280).replace(/\n/g, " ")}`
        )
        .join("\n")
    : "- No leads recorded.";

  const money = invoices.length
    ? invoices
        .map(
          (i) =>
            `- ${i.number ?? "DRAFT"} · ${i.client.name} · ${i.status.toLowerCase()} · ${formatMinor(i.totalMinor - i.amountPaidMinor, i.currency)} outstanding · due ${i.dueAt?.toISOString().slice(0, 10) ?? "no date"}`
        )
        .join("\n")
    : "- No open invoices.";

  const work = projects.length
    ? projects.map((p) => `- ${p.name} · ${p.client.name} · ${p.status.toLowerCase()} · due ${p.dueAt?.toISOString().slice(0, 10) ?? "none"}`).join("\n")
    : "- No active projects.";

  const system = `You are the internal assistant inside GrowinTek's admin. You talk to the owner, not to clients.

Your job: answer questions about the business, summarise the pipeline, draft replies to leads, suggest what to do today, and help write proposals. Be direct and brief. British English.

RULES
- You may see client names and briefs. Never repeat a client's data in a form that could be pasted publicly, and never invent one.
- Use only the data below plus the site context. If a number is not here, say so.
- When drafting a reply to a lead, write it as the owner would: short, specific, one question at a time, no brochure language.
- Never propose a discount below the published tiers without flagging it as a discount.
- Today's date: ${new Date().toISOString().slice(0, 10)}.

PIPELINE (15 most recent leads)
${pipeline}

MONEY (open invoices)
${money}

ACTIVE WORK
${work}

PUBLIC SITE FACTS
${siteContext}`;

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...parsed.data.messages.slice(-10),
  ];

  const result = await chat({ messages, temperature: 0.4, maxTokens: 900 });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "The model did not respond." }, { status: 502 });
  }

  return NextResponse.json({ reply: result.text, provider: result.provider });
}
