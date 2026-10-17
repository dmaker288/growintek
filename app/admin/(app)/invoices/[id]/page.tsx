import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMinor, formatDate, type InvoiceLineInput } from "@/lib/money";
import { issueInvoice, recordPayment, voidInvoice, deleteDraftInvoice } from "@/lib/actions/crm";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!invoice) notFound();

  const items = (invoice.items as unknown as InvoiceLineInput[]) ?? [];
  const billTo = (invoice.billTo ?? {}) as Record<string, string | null>;
  const isDraft = invoice.status === "DRAFT";
  const remaining = invoice.totalMinor - invoice.amountPaidMinor;

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/admin/invoices" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
            ← All invoices
          </Link>
          <h1 className="page-title">
            {invoice.number ?? "Draft invoice"}
            <span style={{ marginLeft: ".6rem", verticalAlign: "middle" }}>
              <StatusPill status={invoice.status} />
            </span>
          </h1>
          <p className="page-sub">
            <Link href={`/admin/clients/${invoice.clientId}`} className="a-link" style={{ fontWeight: 400 }}>
              {invoice.client.company ?? invoice.client.name}
            </Link>
            {invoice.issuedAt && ` · issued ${formatDate(invoice.issuedAt)}`}
            {invoice.dueAt && ` · due ${formatDate(invoice.dueAt)}`}
          </p>
        </div>
        <div className="page-actions">
          {isDraft && (
            <>
              <form action={issueInvoice}>
                <input type="hidden" name="id" value={invoice.id} />
                <button type="submit" className="a-btn a-btn--primary" disabled={invoice.totalMinor <= 0}>
                  Issue invoice
                </button>
              </form>
              <form action={deleteDraftInvoice}>
                <input type="hidden" name="id" value={invoice.id} />
                <button type="submit" className="a-btn a-btn--danger">Delete draft</button>
              </form>
            </>
          )}
          {invoice.number && (
            <Link href={`/admin/print/${invoice.id}`} target="_blank" className="a-btn">
              Print / PDF
            </Link>
          )}
          {invoice.status !== "VOID" && invoice.number && (
            <form action={voidInvoice}>
              <input type="hidden" name="id" value={invoice.id} />
              <button type="submit" className="a-btn a-btn--ghost">Void</button>
            </form>
          )}
        </div>
      </header>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Invoice</h2>
            <span className="dim" style={{ fontSize: ".75rem" }}>
              {invoice.currency} · {invoice.payments.length} payment{invoice.payments.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="panel-body">
            {Object.keys(billTo).length > 0 && (
              <address className="bill-to">
                <strong>{billTo.company || billTo.name}</strong>
                {billTo.addressLine1 && <span>{billTo.addressLine1}</span>}
                {billTo.addressLine2 && <span>{billTo.addressLine2}</span>}
                {(billTo.city || billTo.postcode) && (
                  <span>{[billTo.city, billTo.postcode].filter(Boolean).join(", ")}</span>
                )}
                {billTo.vatNumber && <span className="dim">VAT: {billTo.vatNumber}</span>}
                {billTo.email && <span className="dim">{billTo.email}</span>}
              </address>
            )}

            <div className="a-table-wrap" style={{ marginTop: "1rem" }}>
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="num">Qty</th>
                    <th className="num">Unit</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((line, i) => (
                    <tr key={i}>
                      <td>{line.description}</td>
                      <td className="num">{line.qty}</td>
                      <td className="num">{formatMinor(line.unitMinor, invoice.currency)}</td>
                      <td className="num">{formatMinor(Math.round(line.qty * line.unitMinor), invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="totals" style={{ marginTop: "1rem" }}>
              <div><dt>Subtotal</dt><dd>{formatMinor(invoice.subtotalMinor, invoice.currency)}</dd></div>
              {invoice.discountMinor > 0 && (
                <div><dt>Discount</dt><dd>−{formatMinor(invoice.discountMinor, invoice.currency)}</dd></div>
              )}
              {invoice.taxMinor > 0 && (
                <div>
                  <dt>{invoice.taxLabel} ({invoice.taxRateBps / 100}%)</dt>
                  <dd>{formatMinor(invoice.taxMinor, invoice.currency)}</dd>
                </div>
              )}
              <div className="totals-grand">
                <dt>Total</dt>
                <dd>{formatMinor(invoice.totalMinor, invoice.currency)}</dd>
              </div>
              {invoice.amountPaidMinor > 0 && (
                <>
                  <div><dt>Paid</dt><dd>−{formatMinor(invoice.amountPaidMinor, invoice.currency)}</dd></div>
                  <div style={{ fontWeight: 600 }}>
                    <dt>Outstanding</dt>
                    <dd>{formatMinor(remaining, invoice.currency)}</dd>
                  </div>
                </>
              )}
            </dl>

            {invoice.notes && (
              <div className="invoice-note">
                <p className="dim" style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".08em" }}>Note</p>
                <p style={{ fontSize: ".84rem", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{invoice.notes}</p>
              </div>
            )}
          </div>
        </section>

        <aside className="stack-lg">
          {invoice.number && remaining > 0 && invoice.status !== "VOID" && (
            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Record a payment</h2>
              </div>
              <div className="panel-body">
                <form action={recordPayment} className="a-form">
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <input type="hidden" name="currency" value={invoice.currency} />
                  <div className="a-field">
                    <label htmlFor="amount">Amount ({invoice.currency})</label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={(remaining / 100).toFixed(2)}
                      className="a-input"
                    />
                  </div>
                  <div className="a-form-row">
                    <div className="a-field">
                      <label htmlFor="method">Method</label>
                      <select id="method" name="method" className="a-select" defaultValue="BANK_TRANSFER">
                        <option value="BANK_TRANSFER">Bank transfer</option>
                        <option value="CARD">Card</option>
                        <option value="WISE">Wise</option>
                        <option value="PAYPAL">PayPal</option>
                        <option value="CASH">Cash</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="a-field">
                      <label htmlFor="paidAt">Date</label>
                      <input
                        id="paidAt"
                        name="paidAt"
                        type="date"
                        defaultValue={new Date().toISOString().slice(0, 10)}
                        className="a-input"
                      />
                    </div>
                  </div>
                  <div className="a-field">
                    <label htmlFor="reference">Reference <span className="hint">optional</span></label>
                    <input id="reference" name="reference" className="a-input" placeholder="Bank ref / tx id" />
                  </div>
                  <button type="submit" className="a-btn a-btn--primary">Record payment</button>
                </form>
              </div>
            </section>
          )}

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Payments</h2>
            </div>
            {invoice.payments.length === 0 ? (
              <div className="empty">
                <span>No payments recorded.</span>
              </div>
            ) : (
              <ul className="payment-list">
                {invoice.payments.map((p) => (
                  <li key={p.id}>
                    <span>{formatDate(p.paidAt)}</span>
                    <span className="dim">{p.method.toLowerCase().replace("_", " ")}</span>
                    <span className="mono-num">{formatMinor(p.amountMinor, p.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isDraft && (
            <section className="panel">
              <div className="panel-head"><h2 className="panel-title">Draft</h2></div>
              <div className="panel-body">
                <p className="dim" style={{ fontSize: ".8rem", lineHeight: 1.55 }}>
                  This has no number and is not counted in any report. Deleting a
                  draft does not affect the invoice sequence.
                </p>
              </div>
            </section>
          )}
        </aside>
      </div>

      <style>{`
        .bill-to { display: grid; gap: .1rem; font-style: normal; font-size: .82rem; line-height: 1.5; }
        .totals { display: grid; gap: .45rem; font-size: .84rem; max-width: 24rem; margin-left: auto; }
        .totals > div { display: flex; justify-content: space-between; gap: 1rem; }
        .totals dt { color: #6d6a5b; }
        .totals dd { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
        .totals-grand { border-top: 1px solid #e2dcce; padding-top: .5rem; font-weight: 600; }
        .totals-grand dd { font-size: 1.05rem; }
        .payment-list { display: grid; gap: .55rem; font-size: .8rem; padding: 1rem 1.1rem; }
        .payment-list li { display: grid; grid-template-columns: 6rem 1fr auto; gap: .5rem; align-items: center; }
        .invoice-note { margin-top: 1.2rem; padding-top: .9rem; border-top: 1px solid #e2dcce; display: grid; gap: .25rem; }
      `}</style>
    </>
  );
}
