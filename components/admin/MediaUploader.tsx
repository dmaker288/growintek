"use client";

import { useActionState } from "react";
import { uploadMedia } from "@/lib/actions/media";
import type { MediaState } from "@/lib/action-types";

export default function MediaUploader() {
  const [state, action, pending] = useActionState(uploadMedia, { ok: false } as MediaState);

  return (
    <form action={action} className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Upload</h2>
        <span className="dim" style={{ fontSize: ".72rem" }}>JPG · PNG · WebP · AVIF · SVG · PDF · max 8 MB</span>
      </div>
      <div className="panel-body a-form">
        {state.message && (
          <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`}>{state.message}</p>
        )}
        <div className="a-form-row">
          <div className="a-field">
            <label htmlFor="file">File</label>
            <input id="file" name="file" type="file" required className="a-input" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,application/pdf" />
          </div>
          <div className="a-field">
            <label htmlFor="alt">Alt text <span className="hint">describe the image for screen readers</span></label>
            <input id="alt" name="alt" className="a-input" placeholder="Team reviewing a dashboard on a laptop" />
          </div>
        </div>
        <div>
          <button type="submit" className="a-btn a-btn--primary" disabled={pending}>
            {pending ? "Uploading…" : "Upload file"}
          </button>
        </div>
      </div>
    </form>
  );
}
