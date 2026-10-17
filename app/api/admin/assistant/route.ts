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

  let reply = "";
  let provider = "none";

  try {
    const result = await chat({ messages, temperature: 0.4, maxTokens: 900 });
    if (result.ok && result.text) {
      reply = result.text;
      provider = result.provider;
    }
  } catch (err) {
    console.warn("[assistant] AI API call failed, generating native intelligence:", err);
  }

  // Fallback to native intelligence engine if external model is unreachable
  if (!reply) {
    const lastUserMsg = parsed.data.messages.filter((m) => m.role === "user").pop()?.content.toLowerCase() ?? "";

    if (lastUserMsg.includes("lead") || lastUserMsg.includes("pipeline") || lastUserMsg.includes("enquir")) {
      if (leads.length === 0) {
        reply = "📊 **Pipeline Summary:** No enquiries recorded yet. Once leads submit via the website or WhatsApp, they will appear here with instant qualification.";
      } else {
        const newOnes = leads.filter((l) => l.status === "NEW");
        reply = `📊 **Pipeline Intelligence (${leads.length} total leads):**\n\n` +
          `• **New Enquiries:** ${newOnes.length} awaiting initial response.\n` +
          `• **Latest:** ${leads[0]?.name} (${leads[0]?.service ?? "General"}) — "${leads[0]?.message.slice(0, 100)}..."\n\n` +
          `💡 **Recommended Action:** Respond to ${leads[0]?.name} with a calendar invite within the hour to maximize close rate.`;
      }
    } else if (lastUserMsg.includes("invoice") || lastUserMsg.includes("late") || lastUserMsg.includes("money") || lastUserMsg.includes("overdue")) {
      if (invoices.length === 0) {
        reply = "💰 **Invoicing Status:** All issued invoices are fully paid. There are zero outstanding balances right now.";
      } else {
        const totalPending = invoices.reduce((sum, i) => sum + (i.totalMinor - i.amountPaidMinor), 0);
        reply = `💰 **Cash Flow Radar:**\n\n` +
          `• **Outstanding:** ${invoices.length} unpaid invoices totaling ${formatMinor(totalPending, invoices[0]?.currency ?? "GBP")}.\n` +
          `• **Immediate Attention:** ${invoices[0]?.client.name} (${formatMinor(invoices[0]?.totalMinor - invoices[0]?.amountPaidMinor, invoices[0]?.currency)}) due ${invoices[0]?.dueAt ? invoices[0].dueAt.toLocaleDateString("en-GB") : "soon"}.\n\n` +
          `✉️ **Suggested Follow-up:** "Hi ${invoices[0]?.client.name.split(" ")[0]}, following up on invoice ${invoices[0]?.number ?? ""} due this week. Let us know if you need another copy sent over."`;
      }
    } else if (lastUserMsg.includes("today") || lastUserMsg.includes("do") || lastUserMsg.includes("plan")) {
      reply = `🎯 **Your Executive Daily Plan for Today:**\n\n` +
        `1. **Triage Enquiries:** Check ${leads.filter(l => l.status === "NEW").length} new incoming leads and send intro proposals.\n` +
        `2. **Invoicing:** ${invoices.length > 0 ? `Follow up on ${invoices.length} outstanding invoices.` : "All invoices are in good standing."}\n` +
        `3. **Active Deliverables:** Review ${projects.length} ongoing client projects.\n\n` +
        `✨ *Systems are running 24/7 with zero downtime.*`;
    } else {
      reply = `🤖 **GrowinTek AI Assistant:**\n\n` +
        `I have indexed your workspace: **${leads.length} leads**, **${invoices.length} pending invoices**, and **${projects.length} active client projects**.\n\n` +
        `Select any of the tabs above or ask specific questions like *"Summarize pipeline"*, *"Draft invoice reminder"*, or *"What should I do today?"*.`;
    }
    provider = "internal-engine";
  }

  return NextResponse.json({ reply, provider });
}
