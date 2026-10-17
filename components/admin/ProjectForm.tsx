"use client";

import { useActionState } from "react";
import { saveClientProject } from "@/lib/actions/crm";
import type { ActionState } from "@/lib/action-types";

const initial: ActionState = { ok: false };

export default function ProjectForm({
  clients,
  project,
  defaultClientId,
}: {
  clients: { id: string; name: string; company: string | null; currency: string }[];
  project?: {
    id: string;
    name: string;
    clientId: string;
    status: string;
    budgetMinor: number | null;
    currency: string;
    startsAt: Date | null;
    dueAt: Date | null;
    notes: string | null;
  };
  defaultClientId?: string;
}) {
  const [state, action, pending] = useActionState(saveClientProject, initial);

  return (
    <form action={action} className="panel">
      <div className="panel-head">
        <h2 className="panel-title">{project ? "Project details" : "New project"}</h2>
        <button type="submit" className="a-btn a-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save project"}
        </button>
      </div>
      <div className="panel-body a-form">
        {state.message && (
          <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`}>{state.message}</p>
        )}
        {project && <input type="hidden" name="id" value={project.id} />}

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="project-name">Project name *</label>
            <input
              id="project-name"
              name="name"
              required
              defaultValue={project?.name}
              className="a-input"
              placeholder="Website rebuild — phase 1"
            />
          </div>
          <div className="a-field">
            <label htmlFor="clientId">Client *</label>
            <select
              id="clientId"
              name="clientId"
              required
              defaultValue={project?.clientId ?? defaultClientId ?? ""}
              className="a-select"
            >
              <option value="">Choose a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ?? c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="a-form-row--3 a-form-row">
          <div className="a-field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={project?.status ?? "PLANNING"} className="a-select">
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="REVIEW">Review</option>
              <option value="LAUNCHED">Launched</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="a-field">
            <label htmlFor="budget">Budget</label>
            <input
              id="budget"
              name="budget"
              type="number"
              step="0.01"
              min="0"
              defaultValue={project?.budgetMinor ? (project.budgetMinor / 100).toFixed(2) : ""}
              className="a-input"
            />
          </div>
          <div className="a-field">
            <label htmlFor="project-currency">Currency</label>
            <select id="project-currency" name="currency" defaultValue={project?.currency ?? "GBP"} className="a-select">
              <option value="GBP">GBP</option>
              <option value="AUD">AUD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="startsAt">Start</label>
            <input
              id="startsAt"
              name="startsAt"
              type="date"
              defaultValue={project?.startsAt ? project.startsAt.toISOString().slice(0, 10) : ""}
              className="a-input"
            />
          </div>
          <div className="a-field">
            <label htmlFor="dueAt">Due</label>
            <input
              id="dueAt"
              name="dueAt"
              type="date"
              defaultValue={project?.dueAt ? project.dueAt.toISOString().slice(0, 10) : ""}
              className="a-input"
            />
          </div>
        </div>

        <div className="a-field">
          <label htmlFor="project-notes">Scope notes</label>
          <textarea
            id="project-notes"
            name="notes"
            rows={5}
            defaultValue={project?.notes ?? ""}
            className="a-textarea"
            placeholder="What is included, what is explicitly out of scope, who approves what."
          />
        </div>
      </div>
    </form>
  );
}
