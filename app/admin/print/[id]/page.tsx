import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMinor, formatDate, type InvoiceLineInput } from "@/lib/money";
import { requireUser } from "@/lib/auth";
import { site } from "@/lib/site";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

/**
 * Print-ready invoice, deliberately outside the /admin/(app) group so it has
 * no sidebar. The browser's print dialog handles "Save as PDF" — no PDF
 * library, no font embedding problems, and the recipient gets a normal file.
 */
export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, payments: true },
  });
  if (!invoice || !invoice.number) notFound();

  const items = (invoice.items as unknown as InvoiceLineInput[]) ?? [];
  const billTo = (invoice.billTo ?? {}) as Record<string, string | null>;
  const paid = invoice.payments.reduce((s, p) => s + p.amountMinor, 0);

  return (
    <>
      <PrintButton />

      <article className="sheet">
        <header className="sheet-head">
          <div>
            <p className="sheet-brand">GrowinTek</p>
            <p className="sheet-tagline">Websites · AI agents · Automation</p>
            <address className="sheet-from">
              <span>{site.email}</span>
              <span>{site.domain}</span>
            </address>
          </div>
          <div className="sheet-meta">
            <p className="sheet-word">Invoice</p>
            <dl>
              <div><dt>Number</dt><dd>{invoice.number}</dd></div>
              <div><dt>Issued</dt><dd>{formatDate(invoice.issuedAt)}</dd></div>
              <div><dt>Due</dt><dd>{formatDate(invoice.dueAt)}</dd></div>
            </dl>
          </div>
        </header>

        <section className="sheet-parties">
          <div>
            <p className="sheet-label">Billed to</p>
            <p className="sheet-strong">{billTo.company || billTo.name || invoice.client.name}</p>
            {billTo.addressLine1 && <p>{billTo.addressLine1}</p>}
            {billTo.addressLine2 && <p>{billTo.addressLine2}</p>}
            {(billTo.city || billTo.postcode) && (
              <p>{[billTo.city, billTo.postcode].filter(Boolean).join(", ")}</p>
            )}
            {billTo.vatNumber && <p>VAT: {billTo.vatNumber}</p>}
            {billTo.email && <p>{billTo.email}</p>}
          </div>
          <div>
            <p className="sheet-label">From</p>
            <p className="sheet-strong">GrowinTek</p>
            <p>{site.location}</p>
            <p>{site.email}</p>
          </div>
        </section>

        <table className="sheet-table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="r">Qty</th>
              <th className="r">Unit price</th>
              <th className="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((line, i) => (
              <tr key={i}>
                <td>{line.description}</td>
                <td className="r">{line.qty}</td>
                <td className="r">{formatMinor(line.unitMinor, invoice.currency)}</td>
                <td className="r">{formatMinor(Math.round(line.qty * line.unitMinor), invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="sheet-totals">
          <dl>
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
            <div className="grand"><dt>Total</dt><dd>{formatMinor(invoice.totalMinor, invoice.currency)}</dd></div>
            {paid > 0 && (
              <>
                <div><dt>Paid</dt><dd>−{formatMinor(paid, invoice.currency)}</dd></div>
                <div className="grand">
                  <dt>Balance due</dt>
                  <dd>{formatMinor(invoice.totalMinor - paid, invoice.currency)}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {invoice.notes && (
          <section className="sheet-note">
            <p className="sheet-label">Note</p>
            <p>{invoice.notes}</p>
          </section>
        )}

        {invoice.terms && (
          <section className="sheet-terms">
            <p className="sheet-label">Terms</p>
            <p>{invoice.terms}</p>
          </section>
        )}

        <footer className="sheet-foot">
          <span>GrowinTek · {site.domain}</span>
          <span>{invoice.number}</span>
        </footer>
      </article>

      <style>{`
        body { background: #e8e2d4; }
        .print-bar {
          position: sticky; top: 0; z-index: 10;
          display: flex; justify-content: center;
          padding: .75rem; background: #12130d;
        }
        .print-bar .a-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 34px; padding: .42em .85em; border-radius: 6px;
          border: 1px solid #1b2ce0; background: #1b2ce0; color: #fff;
          font-size: .8rem; font-weight: 550; cursor: pointer;
        }
        .sheet {
          width: 210mm; min-height: 297mm;
          margin: 1.25rem auto; padding: 20mm 18mm;
          background: #fff; color: #17180f;
          box-shadow: 0 20px 40px -20px rgba(20,21,15,.4);
          font-size: 10.5pt; line-height: 1.5;
          display: flex; flex-direction: column;
        }
        .sheet-head { display: flex; justify-content: space-between; gap: 2rem; border-bottom: 1.5px solid #17180f; padding-bottom: 1rem; }
        .sheet-brand { font-family: var(--font-display), Georgia, serif; font-size: 1.6rem; letter-spacing: -.03em; }
        .sheet-tagline { font-size: 8pt; text-transform: uppercase; letter-spacing: .12em; color: #6d6a5b; margin-top: .2rem; }
        .sheet-from { font-style: normal; margin-top: .6rem; font-size: 9pt; color: #3d3c31; display: grid; gap: .1rem; }
        .sheet-meta { text-align: right; }
        .sheet-word { font-family: var(--font-display), Georgia, serif; font-size: 1.5rem; letter-spacing: -.02em; }
        .sheet-meta dl { margin-top: .5rem; display: grid; gap: .15rem; font-size: 9pt; }
        .sheet-meta dl > div { display: flex; justify-content: flex-end; gap: .75rem; }
        .sheet-meta dt { color: #6d6a5b; }
        .sheet-meta dd { font-family: var(--font-mono), monospace; }
        .sheet-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 1.25rem 0; font-size: 9.5pt; }
        .sheet-label { font-family: var(--font-mono), monospace; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .12em; color: #9a9684; margin-bottom: .3rem; }
        .sheet-strong { font-weight: 600; }
        .sheet-table { width: 100%; border-collapse: collapse; margin-top: .5rem; font-size: 9.5pt; }
        .sheet-table th {
          text-align: left; font-family: var(--font-mono), monospace;
          font-size: 7.5pt; text-transform: uppercase; letter-spacing: .1em;
          color: #6d6a5b; border-bottom: 1px solid #bdb4a0; padding: .5rem .4rem;
        }
        .sheet-table td { padding: .55rem .4rem; border-bottom: 1px solid #e3dccd; }
        .sheet-table .r { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .sheet-totals { display: flex; justify-content: flex-end; margin-top: 1rem; }
        .sheet-totals dl { min-width: 62mm; display: grid; gap: .3rem; font-size: 9.5pt; }
        .sheet-totals dl > div { display: flex; justify-content: space-between; gap: 1rem; }
        .sheet-totals dt { color: #6d6a5b; }
        .sheet-totals dd { font-family: var(--font-mono), monospace; }
        .sheet-totals .grand { border-top: 1px solid #17180f; padding-top: .4rem; margin-top: .2rem; font-weight: 600; font-size: 11pt; }
        .sheet-note, .sheet-terms { margin-top: 1.5rem; font-size: 9pt; color: #3d3c31; }
        .sheet-terms { margin-top: auto; padding-top: 1.5rem; border-top: 1px solid #e3dccd; }
        .sheet-foot {
          display: flex; justify-content: space-between; margin-top: 1rem;
          font-size: 8pt; color: #9a9684; font-family: var(--font-mono), monospace;
        }
        @media print {
          .print-bar { display: none; }
          body { background: #fff; }
          .sheet { width: auto; min-height: 0; margin: 0; padding: 14mm; box-shadow: none; }
          @page { size: A4; margin: 0; }
        }
        @media (max-width: 820px) {
          .sheet { width: 100%; margin: 0 auto; padding: 1.25rem; min-height: 0; }
          .sheet-head { flex-direction: column; gap: .75rem; }
          .sheet-meta { text-align: left; }
          .sheet-meta dl > div { justify-content: flex-start; }
          .sheet-parties { grid-template-columns: 1fr; gap: 1rem; }
        }
      `}</style>
    </>
  );
}
