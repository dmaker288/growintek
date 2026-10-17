"use client";

import { useActionState, useState } from "react";
import { saveProject } from "@/lib/actions/content";
import type { ContentState } from "@/lib/action-types";

const initial: ContentState = { ok: false };

type Service = { id: string; name: string };

export default function CaseStudyForm({
  services,
  project,
}: {
  services: Service[];
  project?: {
    id: string;
    slug: string;
    name: string;
    client: string;
    sector: string;
    location: string | null;
    summary: string;
    challenge: string | null;
    approach: string | null;
    outcome: string | null;
    metrics: { label: string; value: string }[];
    serviceId: string | null;
    featured: boolean;
    state: string;
  };
}) {
  const [state, action, pending] = useActionState(saveProject, initial);
  const [metrics, setMetrics] = useState<{ label: string; value: string }[]>(
    project?.metrics?.length ? project.metrics : [{ label: "", value: "" }]
  );

  return (
    <form action={action} className="panel">
      <div className="panel-head">
        <h2 className="panel-title">{project ? "Edit case study" : "New case study"}</h2>
        <button type="submit" className="a-btn a-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save case study"}
        </button>
      </div>

      <div className="panel-body a-form">
        <p className="form-msg form-msg--err" style={{ background: "transparent", padding: 0, color: "#96601f" }}>
          Publish only with the client&apos;s written permission, and only with numbers you can defend.
        </p>

        {state.message && (
          <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`}>{state.message}</p>
        )}
        {project && <input type="hidden" name="id" value={project.id} />}
        <input type="hidden" name="metrics" value={JSON.stringify(metrics.filter((m) => m.label && m.value))} />

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="cs-name">Project title</label>
            <input id="cs-name" name="name" required defaultValue={project?.name} className="a-input" placeholder="Enquiry response for a heating installer" />
          </div>
          <div className="a-field">
            <label htmlFor="cs-slug">Slug</label>
            <input id="cs-slug" name="slug" defaultValue={project?.slug} className="a-input input--mono" />
          </div>
        </div>

        <div className="a-form-row--3 a-form-row">
          <div className="a-field">
            <label htmlFor="cs-client">Client</label>
            <input id="cs-client" name="client" defaultValue={project?.client} className="a-input" />
          </div>
          <div className="a-field">
            <label htmlFor="cs-sector">Sector</label>
            <input id="cs-sector" name="sector" defaultValue={project?.sector} className="a-input" placeholder="Home services" />
          </div>
          <div className="a-field">
            <label htmlFor="cs-location">Location</label>
            <input id="cs-location" name="location" defaultValue={project?.location ?? ""} className="a-input" />
          </div>
        </div>

        <div className="a-field">
          <label htmlFor="cs-summary">Summary</label>
          <textarea id="cs-summary" name="summary" required rows={3} defaultValue={project?.summary} className="a-textarea a-textarea--plain" />
        </div>

        <div className="a-field">
          <label>Metrics <span className="hint">label and value, shown large on the card</span></label>
          <div className="metric-editor">
            {metrics.map((m, i) => (
              <div key={i} className="metric-row">
                <input
                  value={m.label}
                  onChange={(e) => setMetrics((p) => p.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))}
                  placeholder="Response time"
                  aria-label={`Metric ${i + 1} label`}
                  className="a-input"
                />
                <input
                  value={m.value}
                  onChange={(e) => setMetrics((p) => p.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))}
                  placeholder="2h → 34s"
                  aria-label={`Metric ${i + 1} value`}
                  className="a-input"
                />
                <button
                  type="button"
                  className="a-btn a-btn--sm a-btn--ghost"
                  onClick={() => setMetrics((p) => (p.length > 1 ? p.filter((_, xi) => xi !== i) : p))}
                  aria-label={`Remove metric ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="a-btn a-btn--sm"
              onClick={() => setMetrics((p) => [...p, { label: "", value: "" }])}
            >
              + Add metric
            </button>
          </div>
        </div>

        {[
          { field: "challenge", label: "The problem", value: project?.challenge },
          { field: "approach", label: "What we built", value: project?.approach },
          { field: "outcome", label: "What changed", value: project?.outcome },
        ].map((s) => (
          <div className="a-field" key={s.field}>
            <label htmlFor={`cs-${s.field}`}>{s.label}</label>
            <textarea
              id={`cs-${s.field}`}
              name={s.field}
              rows={4}
              defaultValue={s.value ?? ""}
              className="a-textarea a-textarea--plain"
            />
          </div>
        ))}

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="cs-service">Related service</label>
            <select id="cs-service" name="serviceId" defaultValue={project?.serviceId ?? ""} className="a-select">
              <option value="">None</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="a-field" style={{ alignContent: "end" }}>
            <label className="a-check">
              <input type="checkbox" name="featured" defaultChecked={project?.featured} />
              Feature on the homepage
            </label>
          </div>
        </div>
      </div>

      <style>{`
        .metric-editor { display: grid; gap: .4rem; }
        .metric-row { display: grid; grid-template-columns: 1fr 1fr 2rem; gap: .35rem; }
        .metric-editor .a-btn { justify-self: start; }
      `}</style>
    </form>
  );
}
