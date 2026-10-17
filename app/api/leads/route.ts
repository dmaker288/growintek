import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import { sendMail, emailShell, escapeHtml } from "@/lib/mailer";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  email: z.string().trim().email("That email does not look right.").max(200),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(8).optional(),
  service: z.string().trim().max(80).optional(),
  budget: z.string().trim().max(40).optional(),
  message: z.string().trim().min(20, "Tell us a little more — 20 characters minimum.").max(4000),
  consent: z.boolean(),
  plan: z.string().trim().max(40).optional(),
  website_url: z.string().max(0).optional(), // honeypot must stay empty
});

const RATE_WINDOW_MIN = 10;
const RATE_MAX = 5;

function hash(value: string): string {
  const salt = process.env.ANALYTICS_SALT ?? "dev-salt";
  return createHash("sha256").update(`${value}|${salt}`).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Silent success for bots that fill the honeypot.
  if (data.website_url) {
    return NextResponse.json({ ok: true });
  }

  if (!data.consent) {
    return NextResponse.json(
      { error: "Tick the consent box so we know we can reply." },
      { status: 422 }
    );
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ipHash = hash(ip);
  const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000);

  const recent = await prisma.lead.count({
    where: { ipHash, createdAt: { gte: since } },
  });
  if (recent >= RATE_MAX) {
    return NextResponse.json(
      { error: "Too many submissions from this connection. Try again shortly." },
      { status: 429 }
    );
  }

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      company: data.company || null,
      phone: data.phone || null,
      country: data.country || null,
      service: data.service || null,
      budget: data.budget || null,
      message: data.message + (data.plan ? `\n\nPlan interest: ${data.plan}` : ""),
      consent: true,
      ipHash,
      userAgentHash: hash(req.headers.get("user-agent") ?? ""),
      source: "WEBSITE",
      sourceDetail: data.service ?? null,
    },
  });

  await recordEvent({
    type: "form",
    path: "/contact",
    label: "lead-form",
    userAgent: req.headers.get("user-agent"),
    ip,
    country: req.headers.get("x-vercel-ip-country"),
  });

  // Notify the owner. Failure here must not lose the lead — it is already stored.
  const to = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
  if (to) {
    await sendMail({
      to,
      subject: `New enquiry: ${data.name}${data.company ? ` (${data.company})` : ""} — ${data.service ?? "unspecified"}`,
      text: [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Business: ${data.company || "—"}`,
        `Phone: ${data.phone || "—"}`,
        `Country: ${data.country || "—"}`,
        `Service: ${data.service || "—"}`,
        `Budget: ${data.budget || "—"}`,
        "",
        data.message,
        "",
        `Open in CMS: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/leads/${lead.id}`,
      ].join("\n"),
      html: emailShell(
        "New enquiry",
        `<table style="font-size:14px;line-height:1.6;border-collapse:collapse">
          ${row("Name", escapeHtml(data.name))}
          ${row("Email", escapeHtml(data.email))}
          ${row("Business", escapeHtml(data.company || "—"))}
          ${row("Phone", escapeHtml(data.phone || "—"))}
          ${row("Service", escapeHtml(data.service || "—"))}
          ${row("Budget", escapeHtml(data.budget || "—"))}
        </table>
        <p style="margin-top:18px;white-space:pre-wrap">${escapeHtml(data.message)}</p>
        <p style="margin-top:18px"><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/leads" style="color:#1B2CE0">Open in the CMS →</a></p>`
      ),
    });

    // Optional auto-reply, only when the sender gave consent (they did).
    await sendMail({
      to: data.email,
      subject: "Got your brief — reply within one working day",
      text: `Hi ${data.name.split(" ")[0]},\n\nThanks for the detail — it is with us now. You will get a real reply within one working day, from the person who would do the work.\n\nIf it is urgent, reply to this email with URGENT in the subject.\n\n— GrowinTek`,
      html: emailShell(
        "Got your brief",
        `<p>Hi ${escapeHtml(data.name.split(" ")[0])},</p>
         <p>Thanks for the detail — it is with us now. You will get a real reply within one working day, from the person who would do the work.</p>
         <p>If it is urgent, reply to this email with <strong>URGENT</strong> in the subject.</p>
         <p style="color:#6F6A5E">— GrowinTek</p>`
      ),
    });
  }

  return NextResponse.json({ ok: true });
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:2px 14px 2px 0;color:#6F6A5E;vertical-align:top">${label}</td><td>${value}</td></tr>`;
}
