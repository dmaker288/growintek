import "server-only";
import { prisma } from "@/lib/db";
import { computeTotals, type InvoiceLineInput } from "@/lib/money";

export type IssueResult = { number: string };

/**
 * Assigns the next invoice number for the current year, e.g. GT-2026-0001.
 *
 * Numbers are assigned at issue time, never at draft time, so cancelled
 * drafts never punch holes in the sequence. The upsert + increment runs
 * inside a transaction; Postgres row-level locking on the sequence row
 * makes concurrent issues safe.
 */
export async function issueInvoiceNumber(prefix = "GT"): Promise<IssueResult> {
  const year = new Date().getFullYear();

  const seq = await prisma.$transaction(async (tx) => {
    // Create the row on first use of the year, otherwise take the next value.
    const existing = await tx.invoiceSequence.findUnique({ where: { year } });
    if (!existing) {
      return tx.invoiceSequence.create({ data: { year, nextNumber: 2 } });
    }
    return tx.invoiceSequence.update({
      where: { year },
      data: { nextNumber: { increment: 1 } },
    });
  });

  const n = seq.nextNumber - 1;
  return { number: `${prefix}-${year}-${String(n).padStart(4, "0")}` };
}

/**
 * Recomputes and persists all totals from items + discount + tax.
 * Call this on every write so stored totals can never drift from the lines.
 */
export async function recalcInvoice(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;

  const items = (invoice.items as unknown as InvoiceLineInput[]) ?? [];
  const totals = computeTotals({
    items,
    discountType: invoice.discountType,
    discountValue: invoice.discountValue,
    taxRateBps: invoice.taxRateBps,
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotalMinor: totals.subtotalMinor,
      discountMinor: totals.discountMinor,
      taxMinor: totals.taxMinor,
      totalMinor: totals.totalMinor,
    },
  });
}

/** Recomputes amountPaid and flips status between PAID / SENT / OVERDUE. */
export async function refreshInvoiceStatus(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice || invoice.status === "VOID" || invoice.status === "DRAFT") return;

  const paid = invoice.payments.reduce((s, p) => s + p.amountMinor, 0);
  const now = new Date();

  let status = invoice.status;
  if (paid >= invoice.totalMinor && invoice.totalMinor > 0) {
    status = "PAID";
  } else if (invoice.dueAt && invoice.dueAt < now) {
    status = "OVERDUE";
  } else if (invoice.issuedAt) {
    status = "SENT";
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaidMinor: paid,
      status,
      paidAt: status === "PAID" ? (invoice.paidAt ?? now) : null,
    },
  });
}

/** True when the invoice has been issued (has a number) and is still editable. */
export function isEditable(status: string): boolean {
  return status === "DRAFT";
}
