// Money is always integer minor units. These helpers are the only place
// where currency formatting and totals should happen.

export function formatMinor(
  amountMinor: number | null | undefined,
  currency = "GBP",
  opts: { compact?: boolean } = {}
): string {
  if (amountMinor === null || amountMinor === undefined) return "—";
  const value = amountMinor / 100;

  if (opts.compact && Math.abs(value) >= 10_000) {
    const symbol = symbolFor(currency);
    return `${symbol}${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }

  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function localeFor(currency: string): string {
  switch (currency) {
    case "USD":
      return "en-US";
    case "AUD":
      return "en-AU";
    case "CAD":
      return "en-CA";
    case "EUR":
      return "en-IE";
    case "PKR":
      return "en-PK";
    case "AED":
      return "en-AE";
    default:
      return "en-GB";
  }
}

function symbolFor(currency: string): string {
  switch (currency) {
    case "USD":
      return "$";
    case "AUD":
      return "A$";
    case "CAD":
      return "C$";
    case "EUR":
      return "€";
    case "PKR":
      return "₨";
    case "AED":
      return "AED ";
    default:
      return "£";
  }
}

export type InvoiceLineInput = {
  description: string;
  qty: number;
  unitMinor: number;
};

export type InvoiceTotalsInput = {
  items: InvoiceLineInput[];
  discountType?: "NONE" | "PERCENT" | "FIXED";
  discountValue?: number;
  taxRateBps?: number;
};

export type InvoiceTotals = {
  subtotalMinor: number;
  discountMinor: number;
  taxableMinor: number;
  taxMinor: number;
  totalMinor: number;
};

/**
 * Deterministic invoice maths. The same function runs on the server action
 * that saves the invoice and on the PDF renderer, so the two can never
 * disagree.
 *
 * Percent discounts are stored as basis points of the subtotal (1 = 0.01%).
 */
export function computeTotals(input: InvoiceTotalsInput): InvoiceTotals {
  const subtotalMinor = input.items.reduce(
    (sum, line) =>
      sum + Math.round(safeNumber(line.qty) * safeNumber(line.unitMinor)),
    0
  );

  const type = input.discountType ?? "NONE";
  const rawDiscount = Math.max(0, Math.round(safeNumber(input.discountValue)));

  let discountMinor = 0;
  if (type === "PERCENT") {
    // discountValue is basis points here: 1000 = 10%
    discountMinor = Math.round((subtotalMinor * Math.min(rawDiscount, 10_000)) / 10_000);
  } else if (type === "FIXED") {
    discountMinor = Math.min(rawDiscount, subtotalMinor);
  }

  const taxableMinor = Math.max(0, subtotalMinor - discountMinor);
  const taxRateBps = Math.max(0, Math.round(safeNumber(input.taxRateBps)));
  const taxMinor = Math.round((taxableMinor * taxRateBps) / 10_000);

  return {
    subtotalMinor,
    discountMinor,
    taxableMinor,
    taxMinor,
    totalMinor: taxableMinor + taxMinor,
  };
}

export function lineTotal(line: InvoiceLineInput): number {
  return Math.round(safeNumber(line.qty) * safeNumber(line.unitMinor));
}

function safeNumber(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function pctToBps(pct: number): number {
  return Math.round(pct * 100);
}

export function bpsToPct(bps: number): number {
  return bps / 100;
}

export function formatDate(
  date: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", opts).format(d);
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / 86_400_000);
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}
