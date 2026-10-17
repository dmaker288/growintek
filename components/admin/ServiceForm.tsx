"use client";

import { useActionState } from "react";
import { saveService } from "@/lib/actions/content";
import type { ContentState } from "@/lib/action-types";

const initial: ContentState = { ok: false };

export default function ServiceForm({
  service,
}: {
  service?: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    summary: string;
    outcomes: string[];
    deliverables: string[];
    fromPrice: number | null;
    order: number;
    state: string;
  };
}) {
  const [state, action, pending] = useActionState(saveService, initial);

  return (
    <form action={action} className="panel">
      <div className="panel-head">
        <h2 className="panel-title">{service ? "Edit service" : "New service"}</h2>
        <button type="submit" className="a-btn a-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save service"}
        </button>
      </div>

      <div className="panel-body a-form">
        {state.message && (
          <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`}>{state.message}</p>
        )}
        {service && <input type="hidden" name="id" value={service.id} />}

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="svc-name">Name</label>
            <input id="svc-name" name="name" required defaultValue={service?.name} className="a-input" />
          </div>
          <div className="a-field">
            <label htmlFor="svc-slug">Slug</label>
            <input id="svc-slug" name="slug" defaultValue={service?.slug} className="a-input input--mono" />
          </div>
        </div>

        <div className="a-field">
          <label htmlFor="svc-tagline">Tagline <span className="hint">one line, shown under the name</span></label>
          <input id="svc-tagline" name="tagline" defaultValue={service?.tagline} className="a-input" />
        </div>

        <div className="a-field">
          <label htmlFor="svc-summary">Summary</label>
          <textarea id="svc-summary" name="summary" required rows={4} defaultValue={service?.summary} className="a-textarea a-textarea--plain" />
        </div>

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="svc-outcomes">Outcomes <span className="hint">one per line</span></label>
            <textarea id="svc-outcomes" name="outcomes" rows={4} defaultValue={service?.outcomes.join("\n")} className="a-textarea" />
          </div>
          <div className="a-field">
            <label htmlFor="svc-deliverables">Deliverables <span className="hint">one per line</span></label>
            <textarea id="svc-deliverables" name="deliverables" rows={4} defaultValue={service?.deliverables.join("\n")} className="a-textarea" />
          </div>
        </div>

        <div className="a-form-row--3 a-form-row">
          <div className="a-field">
            <label htmlFor="svc-price">From price <span className="hint">whole currency units</span></label>
            <input
              id="svc-price"
              name="fromPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={service?.fromPrice ? service.fromPrice / 100 : ""}
              className="a-input"
            />
          </div>
          <div className="a-field">
            <label htmlFor="svc-order">Display order</label>
            <input id="svc-order" name="order" type="number" defaultValue={service?.order ?? 0} className="a-input" />
          </div>
          <div className="a-field">
            <label htmlFor="svc-state">State</label>
            <select id="svc-state" name="state" defaultValue={service?.state ?? "PUBLISHED"} className="a-select">
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
