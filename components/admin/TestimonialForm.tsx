"use client";

import { useActionState } from "react";
import { saveTestimonial } from "@/lib/actions/content";
import type { ContentState } from "@/lib/action-types";

const initial: ContentState = { ok: false };

export default function TestimonialForm() {
  const [state, action, pending] = useActionState(saveTestimonial, initial);

  return (
    <form action={action} className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Add a testimonial</h2>
        <button type="submit" className="a-btn a-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="panel-body a-form">
        {state.message && (
          <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`}>{state.message}</p>
        )}
        <div className="a-form-row--3 a-form-row">
          <div className="a-field">
            <label htmlFor="t-name">Name</label>
            <input id="t-name" name="name" required className="a-input" />
          </div>
          <div className="a-field">
            <label htmlFor="t-role">Role</label>
            <input id="t-role" name="role" className="a-input" placeholder="Owner" />
          </div>
          <div className="a-field">
            <label htmlFor="t-company">Company</label>
            <input id="t-company" name="company" className="a-input" />
          </div>
        </div>
        <div className="a-field">
          <label htmlFor="t-quote">Quote <span className="hint">their words, not yours</span></label>
          <textarea id="t-quote" name="quote" required rows={3} className="a-textarea a-textarea--plain" />
        </div>
        <div className="a-form-row--3 a-form-row">
          <div className="a-field">
            <label htmlFor="t-rating">Rating</label>
            <select id="t-rating" name="rating" defaultValue="5" className="a-select">
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>
          <div className="a-field">
            <label htmlFor="t-source">Source URL <span className="hint">optional</span></label>
            <input id="t-source" name="sourceUrl" className="a-input" placeholder="Link to the review" />
          </div>
          <div className="a-field" style={{ alignContent: "end", gap: ".45rem" }}>
            <label className="a-check">
              <input type="checkbox" name="approved" />
              Approved to show publicly
            </label>
            <label className="a-check">
              <input type="checkbox" name="featured" />
              Feature on the homepage
            </label>
          </div>
        </div>
      </div>
      <div className="panel-foot">
        Nothing appears on the site until “Approved” is ticked. That is deliberate.
      </div>
    </form>
  );
}
