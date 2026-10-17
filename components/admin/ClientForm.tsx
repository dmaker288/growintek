"use client";

import { useActionState } from "react";
import { saveClient } from "@/lib/actions/crm";
import type { ActionState } from "@/lib/action-types";

const initial: ActionState = { ok: false };

export default function ClientForm({
  client,
}: {
  client?: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    currency: string;
    vatNumber: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    postcode: string | null;
    notes: string | null;
  };
}) {
  const [state, action, pending] = useActionState(saveClient, initial);

  return (
    <form action={action} className="panel">
      <div className="panel-head">
        <h2 className="panel-title">{client ? "Edit client" : "New client"}</h2>
        <button type="submit" className="a-btn a-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save client"}
        </button>
      </div>

      <div className="panel-body a-form">
        {state.message && (
          <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`}>{state.message}</p>
        )}
        {client && <input type="hidden" name="id" value={client.id} />}

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="name">Contact name *</label>
            <input id="name" name="name" required defaultValue={client?.name} className="a-input" />
          </div>
          <div className="a-field">
            <label htmlFor="company">Business</label>
            <input id="company" name="company" defaultValue={client?.company ?? ""} className="a-input" />
          </div>
        </div>

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue={client?.email ?? ""} className="a-input" />
          </div>
          <div className="a-field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={client?.phone ?? ""} className="a-input" />
          </div>
        </div>

        <div className="a-form-row--3 a-form-row">
          <div className="a-field">
            <label htmlFor="country">Country</label>
            <select id="country" name="country" defaultValue={client?.country ?? "GB"} className="a-select">
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="IE">Ireland</option>
              <option value="EU">Europe</option>
              <option value="US">United States</option>
              <option value="PK">Pakistan</option>
              <option value="AE">UAE</option>
            </select>
          </div>
          <div className="a-field">
            <label htmlFor="currency">Invoice currency</label>
            <select id="currency" name="currency" defaultValue={client?.currency ?? "GBP"} className="a-select">
              <option value="GBP">GBP £</option>
              <option value="AUD">AUD A$</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="CAD">CAD C$</option>
              <option value="PKR">PKR ₨</option>
              <option value="AED">AED</option>
            </select>
          </div>
          <div className="a-field">
            <label htmlFor="vatNumber">VAT / ABN <span className="hint">optional</span></label>
            <input id="vatNumber" name="vatNumber" defaultValue={client?.vatNumber ?? ""} className="a-input" />
          </div>
        </div>

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="addressLine1">Address line 1</label>
            <input id="addressLine1" name="addressLine1" defaultValue={client?.addressLine1 ?? ""} className="a-input" />
          </div>
          <div className="a-field">
            <label htmlFor="addressLine2">Address line 2</label>
            <input id="addressLine2" name="addressLine2" defaultValue={client?.addressLine2 ?? ""} className="a-input" />
          </div>
        </div>

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="city">City</label>
            <input id="city" name="city" defaultValue={client?.city ?? ""} className="a-input" />
          </div>
          <div className="a-field">
            <label htmlFor="postcode">Postcode</label>
            <input id="postcode" name="postcode" defaultValue={client?.postcode ?? ""} className="a-input" />
          </div>
        </div>

        <div className="a-field">
          <label htmlFor="notes">Notes <span className="hint">only visible in the admin</span></label>
          <textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} className="a-textarea" rows={4} />
        </div>
      </div>
    </form>
  );
}
