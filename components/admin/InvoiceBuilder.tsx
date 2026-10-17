"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { computeTotals, formatMinor } from "@/lib/money";
import type { ActionState } from "@/lib/action-types";

type Client = { id: string; name: string; company: string | null; currency: string };

type Item = { description: string; qty: number; unit: number };

export default function InvoiceBuilder({
  clients,
  defaultClientId,
  action,
  state,
  pending,
}: {
  clients: Client[];
  defaultClientId?: string;
  action: (payload: FormData) => void | Promise<void>;
  state: ActionState;
  pending: boolean;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? clients[0]?.id ?? "");
  const [currency, setCurrency] = useState(
    clients.find((c) => c.id === defaultClientId)?.currency ?? "GBP"
  );
  const [items, setItems] = useState<Item[]>([{ description: "", qty: 1, unit: 0 }]);
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENT" | "FIXED">("NONE");
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxLabel, setTaxLabel] = useState("VAT");
  const [dueAt, setDueAt] = useState(isoDaysFromNow(14));
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment by bank transfer within 14 days. Late payment may incur statutory interest.");

  const totals = useMemo(() => {
    return computeTotals({
      items: items.map((i) => ({
        description: i.description,
        qty: i.qty,
        unitMinor: Math.round(i.unit * 100),
      })),
      discountType,
      // PERCENT goes to the server in basis points (10% → 1000);
      // FIXED goes in minor units (£10 → 1000). Both are ×100 of the input.
      discountValue: Math.round(discount * 100),
      taxRateBps: Math.round(taxRate * 100),
    });
  }, [items, discountType, discount, taxRate]);

  const payload = JSON.stringify(
    items
      .filter((i) => i.description.trim() && i.qty > 0)
      .map((i) => ({ description: i.description, qty: i.qty, unitMinor: Math.round(i.unit * 100) }))
  );

  function setItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  return (
    <form action={action} className="invoice-builder">
      {state.message && (
        <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`} style={{ gridColumn: "1 / -1" }}>
          {state.message}
        </p>
      )}
      <input type="hidden" name="items" value={payload} />
      <input type="hidden" name="discountType" value={discountType} />
      <input type="hidden" name="discountValue" value={discount} />
      <input type="hidden" name="taxRate" value={taxRate} />
      <input type="hidden" name="taxLabel" value={taxLabel} />
      <input type="hidden" name="currency" value={currency} />

      <div className="builder-main">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Bill to</h2>
          </div>
          <div className="panel-body a-form">
            {clients.length === 0 ? (
              <p className="dim">
                No clients yet. <Link href="/admin/clients/new" className="a-link">Add one first</Link>.
              </p>
            ) : (
              <div className="a-form-row">
                <div className="a-field">
                  <label htmlFor="clientId">Client *</label>
                  <select
                    id="clientId"
                    name="clientId"
                    required
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      const c = clients.find((x) => x.id === e.target.value);
                      if (c) setCurrency(c.currency);
                    }}
                    className="a-select"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company ?? c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="a-field">
                  <label htmlFor="dueAt">Payment due</label>
                  <input
                    id="dueAt"
                    name="dueAt"
                    type="date"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="a-input"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Line items</h2>
            <button
              type="button"
              className="a-btn a-btn--sm"
              onClick={() => setItems((p) => [...p, { description: "", qty: 1, unit: 0 }])}
            >
              + Add line
            </button>
          </div>
          <div className="panel-body">
            <div className="item-head" aria-hidden="true">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit price</span>
              <span>Line total</span>
              <span />
            </div>
            <div className="items">
              {items.map((it, i) => (
                <div className="item-row" key={i}>
                  <input
                    aria-label={`Description for line ${i + 1}`}
                    value={it.description}
                    onChange={(e) => setItem(i, { description: e.target.value })}
                    placeholder="Website build — 6 pages"
                    className="a-input"
                  />
                  <input
                    aria-label={`Quantity for line ${i + 1}`}
                    type="number"
                    min={0}
                    step="0.25"
                    value={it.qty}
                    onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
                    className="a-input"
                  />
                  <input
                    aria-label={`Unit price for line ${i + 1}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.unit}
                    onChange={(e) => setItem(i, { unit: Number(e.target.value) })}
                    className="a-input"
                  />
                  <span className="item-total mono-num">
                    {formatMinor(Math.round(it.qty * it.unit * 100), currency)}
                  </span>
                  <button
                    type="button"
                    className="a-btn a-btn--sm a-btn--ghost"
                    aria-label={`Remove line ${i + 1}`}
                    onClick={() => setItems((p) => (p.length > 1 ? p.filter((_, x) => x !== i) : p))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Discount and tax</h2>
          </div>
          <div className="panel-body a-form">
            <div className="a-form-row">
              <div className="a-field">
                <label htmlFor="discountType">Discount</label>
                <select
                  id="discountType"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "NONE" | "PERCENT" | "FIXED")}
                  className="a-select"
                >
                  <option value="NONE">None</option>
                  <option value="PERCENT">Percentage</option>
                  <option value="FIXED">Fixed amount</option>
                </select>
              </div>
              <div className="a-field">
                <label htmlFor="discount">Value {discountType === "PERCENT" ? "(%)" : `(${currency})`}</label>
                <input
                  id="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  disabled={discountType === "NONE"}
                  className="a-input"
                />
              </div>
            </div>
            <div className="a-form-row">
              <div className="a-field">
                <label htmlFor="taxRate">Tax rate (%)</label>
                <input
                  id="taxRate"
                  type="number"
                  min={0}
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="a-input"
                />
              </div>
              <div className="a-field">
                <label htmlFor="taxLabel">Tax label</label>
                <select
                  id="taxLabel"
                  value={taxLabel}
                  onChange={(e) => setTaxLabel(e.target.value)}
                  className="a-select"
                >
                  <option value="VAT">VAT</option>
                  <option value="GST">GST</option>
                  <option value="Tax">Tax</option>
                  <option value="None">No tax</option>
                </select>
              </div>
            </div>
            <div className="a-field">
              <label htmlFor="notes">Notes to client <span className="hint">optional</span></label>
              <textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="a-textarea a-textarea--plain"
                placeholder="Thanks for the work — milestone 1 delivered."
              />
            </div>
            <div className="a-field">
              <label htmlFor="terms">Terms</label>
              <textarea
                id="terms"
                name="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                className="a-textarea a-textarea--plain"
              />
            </div>
          </div>
        </section>
      </div>

      <aside className="builder-side">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Summary</h2>
          </div>
          <div className="panel-body">
            <dl className="totals">
              <div><dt>Subtotal</dt><dd>{formatMinor(totals.subtotalMinor, currency)}</dd></div>
              {totals.discountMinor > 0 && (
                <div><dt>Discount</dt><dd>−{formatMinor(totals.discountMinor, currency)}</dd></div>
              )}
              {totals.taxMinor > 0 && (
                <div>
                  <dt>{taxLabel} at {taxRate}%</dt>
                  <dd>{formatMinor(totals.taxMinor, currency)}</dd>
                </div>
              )}
              <div className="totals-grand">
                <dt>Total</dt>
                <dd>{formatMinor(totals.totalMinor, currency)}</dd>
              </div>
            </dl>

            <div className="builder-actions">
              <button type="submit" name="action" value="draft" className="a-btn" disabled={pending}>
                {pending ? "Saving…" : "Save draft"}
              </button>
            </div>
            <p className="dim" style={{ fontSize: ".72rem", marginTop: ".6rem", lineHeight: 1.5 }}>
              Saving stores a draft with no number. Open the draft to issue it —
              issuing assigns the next number in sequence and locks the invoice.
              Totals are recomputed on the server; this summary is a preview.
            </p>
          </div>
        </section>
      </aside>

      <style>{`
        .invoice-builder {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 20rem;
          gap: 1rem;
          align-items: start;
        }
        .builder-main { display: grid; gap: 1rem; }
        .builder-side { position: sticky; top: 70px; }
        .item-head, .item-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 4.5rem 7rem 7rem 2rem;
          gap: .5rem;
          align-items: center;
        }
        .item-head {
          font-family: var(--font-mono);
          font-size: .58rem;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #9a9684;
          padding-bottom: .35rem;
        }
        .items { display: grid; gap: .45rem; }
        .item-total { font-size: .8rem; text-align: right; color: #3d3c31; }
        .totals { display: grid; gap: .5rem; font-size: .82rem; }
        .totals > div { display: flex; justify-content: space-between; gap: 1rem; }
        .totals dt { color: #6d6a5b; }
        .totals dd { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
        .totals-grand { border-top: 1px solid #e2dcce; padding-top: .6rem; margin-top: .2rem; font-weight: 600; }
        .totals-grand dd { font-size: 1.05rem; }
        .builder-actions { display: grid; gap: .45rem; margin-top: 1rem; }
        .a-textarea--plain { font-family: inherit; font-size: .82rem; }
        @media (max-width: 1000px) {
          .invoice-builder { grid-template-columns: 1fr; }
          .builder-side { position: static; }
          .item-head { display: none; }
          .item-row { grid-template-columns: 1fr 1fr; }
          .item-row > input:first-child { grid-column: 1 / -1; }
          .item-total { text-align: left; }
        }
      `}</style>
    </form>
  );
}

function isoDaysFromNow(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}
