"use client";

import { useActionState } from "react";
import { runSync } from "@/lib/actions/settings";
import type { SyncState } from "@/lib/action-types";

const initial: SyncState = { ok: false };

export default function SyncButton() {
  const [state, action, pending] = useActionState(runSync, initial);

  return (
    <div className="sync-box">
      <form action={action}>
        <button type="submit" className="a-btn a-btn--primary" disabled={pending}>
          {pending ? "Syncing…" : "Sync reviews and feeds"}
        </button>
      </form>
      {state.message && (
        <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`}>{state.message}</p>
      )}
      {state.lines && state.lines.length > 0 && (
        <ul className="sync-lines">
          {state.lines.map((l) => (
            <li key={l.platform}>
              <span className={`pill ${l.ok ? "pill--green" : "pill--grey"}`}>{l.platform}</span>
              <span>{l.message}</span>
            </li>
          ))}
        </ul>
      )}
      <style>{`
        .sync-box { display: grid; gap: .6rem; }
        .sync-lines { display: grid; gap: .35rem; font-size: .78rem; }
        .sync-lines li { display: grid; grid-template-columns: 7rem 1fr; gap: .5rem; align-items: center; }
      `}</style>
    </div>
  );
}
