import { list } from "./db.js";
import { invoiceTotals } from "./validation.js";
export async function fundsReport(db) {
  const entries = await list(db, "transactions"),
    invoices = await list(db, "invoices");
  const currencies = new Set([
    "USD",
    "PKR",
    ...entries.map((e) => e.currency),
    ...invoices.map((e) => e.currency),
  ]);
  return {
    currencies: [...currencies].map((currency) => {
      const sum = (type) =>
        entries
          .filter(
            (e) =>
              e.currency === currency &&
              e.type === type &&
              e.status === "recorded",
          )
          .reduce((n, e) => n + Math.round(e.amount * 100), 0) / 100;
      const invoiceSum = (status) =>
        invoices
          .filter((i) => i.currency === currency && i.status === status)
          .reduce((n, i) => n + Math.round(invoiceTotals(i).total * 100), 0) /
        100;
      const income = sum("income"),
        expenses = sum("expense");
      return {
        currency,
        income,
        expenses,
        balance: Math.round((income - expenses) * 100) / 100,
        paidInvoices: invoiceSum("paid"),
        outstanding: invoiceSum("sent"),
      };
    }),
  };
}
