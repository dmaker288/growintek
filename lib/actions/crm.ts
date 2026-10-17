"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, assertSameOrigin } from "@/lib/auth";
import { computeTotals, type InvoiceLineInput } from "@/lib/money";
import { issueInvoiceNumber, refreshInvoiceStatus } from "@/lib/invoices";
import type { ActionState } from "@/lib/action-types";

async function guard() {
  const user = await requireUser();
  const h = await headers();
  assertSameOrigin(h.get("origin"), h.get("host"));
  return user;
}

// ─────────────────────────────────────────────────────────────
// Leads
// ─────────────────────────────────────────────────────────────

export async function updateLeadStatus(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "NEW"
    | "QUALIFIED"
    | "PROPOSAL"
    | "WON"
    | "LOST";

  if (!["NEW", "QUALIFIED", "PROPOSAL", "WON", "LOST"].includes(status)) return;
  await prisma.lead.update({ where: { id }, data: { status } }).catch(() => null);
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}

export async function convertLeadToClient(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || lead.convertedClientId) return;

  const client = await prisma.client.create({
    data: {
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      currency: lead.country === "AU" ? "AUD" : lead.country === "US" ? "USD" : "GBP",
      notes: lead.message,
    },
  });

  await prisma.lead.update({
    where: { id },
    data: { convertedClientId: client.id, status: "WON" },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${client.id}`);
}

// ─────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────

const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Client name is required.").max(160),
  company: z.string().trim().max(160).optional(),
  email: z.string().trim().email("That email is not valid.").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().max(4).optional(),
  currency: z.string().trim().length(3).optional(),
  vatNumber: z.string().trim().max(40).optional(),
  addressLine1: z.string().trim().max(160).optional(),
  addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  postcode: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export async function saveClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();

  const parsed = clientSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    company: formData.get("company") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    country: formData.get("country") || "",
    currency: formData.get("currency") || "GBP",
    vatNumber: formData.get("vatNumber") || "",
    addressLine1: formData.get("addressLine1") || "",
    addressLine2: formData.get("addressLine2") || "",
    city: formData.get("city") || "",
    postcode: formData.get("postcode") || "",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const d = parsed.data;
  const data = {
    name: d.name,
    company: d.company || null,
    email: d.email || null,
    phone: d.phone || null,
    country: d.country || null,
    currency: d.currency || "GBP",
    vatNumber: d.vatNumber || null,
    addressLine1: d.addressLine1 || null,
    addressLine2: d.addressLine2 || null,
    city: d.city || null,
    postcode: d.postcode || null,
    notes: d.notes || null,
  };

  const client = d.id
    ? await prisma.client.update({ where: { id: d.id }, data })
    : await prisma.client.create({ data });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${client.id}`);
  return { ok: true, message: "Saved.", id: client.id };
}

export async function archiveClient(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return;
  // Archive, never delete: invoices and projects reference this record.
  await prisma.client.update({ where: { id }, data: { archived: !client.archived } });
  revalidatePath("/admin/clients");
}

// ─────────────────────────────────────────────────────────────
// Client projects
// ─────────────────────────────────────────────────────────────

export async function saveClientProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();

  const id = String(formData.get("id") ?? "") || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "");
  if (!name || !clientId) return { ok: false, message: "Project name and client are required." };

  const budget = String(formData.get("budget") ?? "").replace(/[^0-9.]/g, "");
  const status = String(formData.get("status") ?? "PLANNING") as
    | "PLANNING"
    | "IN_PROGRESS"
    | "REVIEW"
    | "LAUNCHED"
    | "PAUSED"
    | "CLOSED";

  const data = {
    name,
    clientId,
    status,
    budgetMinor: budget ? Math.round(Number(budget) * 100) : null,
    currency: String(formData.get("currency") ?? "GBP"),
    startsAt: dateOrNull(formData.get("startsAt")),
    dueAt: dateOrNull(formData.get("dueAt")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };

  const project = id
    ? await prisma.clientProject.update({ where: { id }, data })
    : await prisma.clientProject.create({ data });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true, message: "Saved.", id: project.id };
}

export async function toggleTask(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;

  await prisma.task.update({
    where: { id },
    data: { done: !task.done, completedAt: task.done ? null : new Date() },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${task.clientProjectId ?? ""}`);
}

export async function addTask(formData: FormData): Promise<void> {
  await guard();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await prisma.task.create({
    data: {
      title,
      dueAt: dateOrNull(formData.get("dueAt")),
      clientProjectId: String(formData.get("projectId") ?? "") || null,
      priority: Number(formData.get("priority") ?? 2) || 2,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

function dateOrNull(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ─────────────────────────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────────────────────────

function parseItems(raw: string | null): InvoiceLineInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { description?: string; qty?: number | string; unitMinor?: number | string }[];
    return parsed
      .filter((i) => i.description && String(i.description).trim())
      .map((i) => ({
        description: String(i.description).slice(0, 200),
        qty: Number(i.qty ?? 1) || 0,
        unitMinor: Math.round(Number(i.unitMinor ?? 0)) || 0,
      }))
      .filter((i) => i.qty > 0);
  } catch {
    return [];
  }
}

export async function saveInvoice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();

  const id = String(formData.get("id") ?? "") || undefined;
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { ok: false, message: "Choose a client." };

  const items = parseItems(String(formData.get("items") ?? "[]"));
  if (items.length === 0) return { ok: false, message: "Add at least one line item." };

  const existing = id ? await prisma.invoice.findUnique({ where: { id } }) : null;
  if (existing && existing.status !== "DRAFT") {
    return { ok: false, message: "Issued invoices are locked. Void it and create a new one." };
  }

  const discountType = String(formData.get("discountType") ?? "NONE") as "NONE" | "PERCENT" | "FIXED";
  const discountRaw = String(formData.get("discountValue") ?? "0").replace(/[^0-9.]/g, "");
  const discountValue =
    discountType === "PERCENT"
      ? Math.round(Number(discountRaw || 0) * 100) // percent → basis points
      : Math.round(Number(discountRaw || 0) * 100); // fixed → minor units

  const taxPct = String(formData.get("taxRate") ?? "0").replace(/[^0-9.]/g, "");
  const taxRateBps = Math.round(Number(taxPct || 0) * 100);

  const totals = computeTotals({ items, discountType, discountValue, taxRateBps });

  const data = {
    clientId,
    currency: String(formData.get("currency") ?? "GBP"),
    items,
    notes: String(formData.get("notes") ?? "").trim() || null,
    terms: String(formData.get("terms") ?? "").trim() || null,
    discountType,
    discountValue,
    taxRateBps,
    taxLabel: String(formData.get("taxLabel") ?? "VAT"),
    subtotalMinor: totals.subtotalMinor,
    discountMinor: totals.discountMinor,
    taxMinor: totals.taxMinor,
    totalMinor: totals.totalMinor,
    dueAt: dateOrNull(formData.get("dueAt")),
  };

  const invoice = id
    ? await prisma.invoice.update({ where: { id }, data })
    : await prisma.invoice.create({ data });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoice.id}`);
  return { ok: true, message: "Draft saved.", id: invoice.id };
}

export async function issueInvoice(formData: FormData): Promise<void> {
  const user = await guard();
  if (user.role !== "ADMIN") return;

  const id = String(formData.get("id") ?? "");
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { client: true } });
  if (!invoice || invoice.number) return;
  if (invoice.totalMinor <= 0) return;

  const { number } = await issueInvoiceNumber("GT");
  const dueAt = invoice.dueAt ?? new Date(Date.now() + 14 * 86_400_000);

  await prisma.invoice.update({
    where: { id },
    data: {
      number,
      status: "SENT",
      issuedAt: new Date(),
      dueAt,
      billTo: {
        name: invoice.client.name,
        company: invoice.client.company,
        email: invoice.client.email,
        vatNumber: invoice.client.vatNumber,
        addressLine1: invoice.client.addressLine1,
        addressLine2: invoice.client.addressLine2,
        city: invoice.client.city,
        postcode: invoice.client.postcode,
        country: invoice.client.country,
      },
    },
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
  revalidatePath("/admin");
}

export async function recordPayment(formData: FormData): Promise<void> {
  await guard();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amount = String(formData.get("amount") ?? "").replace(/[^0-9.]/g, "");
  const amountMinor = Math.round(Number(amount || 0) * 100);

  if (!invoiceId || amountMinor <= 0) return;

  await prisma.payment.create({
    data: {
      invoiceId,
      amountMinor,
      currency: String(formData.get("currency") ?? "GBP"),
      method: (String(formData.get("method") ?? "BANK_TRANSFER") as
        | "BANK_TRANSFER"
        | "CARD"
        | "WISE"
        | "PAYPAL"
        | "CASH"
        | "OTHER"),
      reference: String(formData.get("reference") ?? "").trim() || null,
      paidAt: dateOrNull(formData.get("paidAt")) ?? new Date(),
    },
  });

  await refreshInvoiceStatus(invoiceId);
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin");
}

export async function voidInvoice(formData: FormData): Promise<void> {
  const user = await guard();
  if (user.role !== "ADMIN") return;
  const id = String(formData.get("id") ?? "");
  await prisma.invoice.update({ where: { id }, data: { status: "VOID" } }).catch(() => null);
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
}

export async function deleteDraftInvoice(formData: FormData): Promise<void> {
  const user = await guard();
  if (user.role !== "ADMIN") return;
  const id = String(formData.get("id") ?? "");
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.status !== "DRAFT" || invoice.number) return;
  await prisma.invoice.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/invoices");
}

// ─────────────────────────────────────────────────────────────
// Expenses
// ─────────────────────────────────────────────────────────────

export async function addExpense(formData: FormData): Promise<void> {
  await guard();
  const label = String(formData.get("label") ?? "").trim();
  const amount = String(formData.get("amount") ?? "").replace(/[^0-9.]/g, "");
  const amountMinor = Math.round(Number(amount || 0) * 100);
  if (!label || amountMinor <= 0) return;

  await prisma.expense.create({
    data: {
      label,
      amountMinor,
      currency: String(formData.get("currency") ?? "GBP"),
      category: String(formData.get("category") ?? "Software"),
      spentAt: dateOrNull(formData.get("spentAt")) ?? new Date(),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

export async function addTimeEntry(formData: FormData): Promise<void> {
  await guard();
  const minutes = Math.round(Number(formData.get("minutes") ?? 0));
  if (!minutes || minutes <= 0) return;

  await prisma.timeEntry.create({
    data: {
      minutes,
      note: String(formData.get("note") ?? "").trim() || null,
      billable: formData.get("billable") === "on",
      clientId: String(formData.get("clientId") ?? "") || null,
      projectId: String(formData.get("projectId") ?? "") || null,
      startedAt: dateOrNull(formData.get("startedAt")) ?? new Date(),
    },
  });

  revalidatePath("/admin/finance");
}
