import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMinor, formatDate, daysBetween } from "@/lib/money";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    include: { client: { select: { name: true, company: true } } },
  });

  const totals = {
    draft: 0,
    sent: 0,
    overdue: 0,
    paid: 0,
  };
  for (const i of invoices) {
    if (i.status === "DRAFT") totals.draft += i.totalMinor;
    if (i.status === "SENT") totals.sent += i.totalMinor - i.amountPaidMinor;
    if (i.status === "OVERDUE") totals.overdue += i.totalMinor - i.amountPaidMinor;
    if (i.status === "PAID") totals.paid += i.totalMinor;
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-sub">Sequential numbering, locked once issued, payments recorded against each.</p>
        </div>
        <div className="page-actions">
          <Link href="/admin/invoices/new" className="a-btn a-btn--primary">New invoice</Link>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Drafts</span>
          <span className="kpi-value">{formatMinor(totals.draft, "GBP")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Awaiting payment</span>
          <span className="kpi-value">{formatMinor(totals.sent, "GBP")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Overdue</span>
          <span className="kpi-value" style={totals.overdue > 0 ? { color: "#96331f" } : undefined}>
            {formatMinor(totals.overdue, "GBP")}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Paid</span>
          <span className="kpi-value">{formatMinor(totals.paid, "GBP")}</span>
        </div>
      </div>

      <section className="panel">
        {invoices.length === 0 ? (
          <div className="empty">
            <strong>No invoices yet</strong>
            <span>Create one from a client record, or start a blank invoice.</span>
            <div style={{ marginTop: ".6rem" }}>
              <Link href="/admin/invoices/new" className="a-btn a-btn--sm">Create the first invoice</Link>
            </div>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                  <th className="num">Paid</th>
                  <th className="num">Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => {
                  const late = i.dueAt && i.status !== "PAID" ? daysBetween(i.dueAt, new Date()) : 0;
                  return (
                    <tr key={i.id}>
                      <td>
                        <Link href={`/admin/invoices/${i.id}`} className="a-link mono-num">
                          {i.number ?? "Draft"}
                        </Link>
                      </td>
                      <td className="dim">{i.client.company ?? i.client.name}</td>
                      <td><StatusPill status={i.status} /></td>
                      <td className="num">{formatMinor(i.totalMinor, i.currency)}</td>
                      <td className="num dim">{formatMinor(i.amountPaidMinor, i.currency)}</td>
                      <td className="num dim">
                        {i.status === "PAID"
                          ? formatDate(i.paidAt)
                          : late > 0
                            ? <span style={{ color: "#96331f" }}>{late}d late</span>
                            : i.dueAt
                              ? formatDate(i.dueAt)
                              : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
