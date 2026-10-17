"use client";

import { useActionState } from "react";
import { runAssistant } from "@/lib/actions/assistant";
import type { AssistantState } from "@/lib/action-types";

const initial: AssistantState = { ok: false };

export default function BlogAssistant({
  title,
  body,
  onAdopt,
}: {
  title: string;
  body: string;
  onAdopt: (patch: { title?: string; excerpt?: string; body?: string }) => void;
}) {
  const [state, action, pending] = useActionState(runAssistant, initial);

  return (
    <section className="assistant panel">
      <div className="panel-head">
        <h2 className="panel-title">
          Writing assistant
          <span className="chip-ai">Qwen · Gemini fallback</span>
        </h2>
      </div>

      <div className="panel-body">
        <p className="assistant-note">
          Drafts and rewrites are returned for review — nothing is saved to the post until
          you press Save. The model only sees the title, brief and body you send here.
        </p>

        <form action={action} className="a-form">
          <div className="a-field">
            <label htmlFor="assist-topic">
              Topic or brief <span className="hint">what should the post argue?</span>
            </label>
            <input
              id="assist-topic"
              name="instruction"
              className="a-input"
              placeholder="Why a £49/month chatbot will not fix a missed enquiry"
            />
          </div>

          <input type="hidden" name="title" value={title} />
          <input type="hidden" name="body" value={body} />

          <div className="a-field">
            <label htmlFor="assist-keywords">
              Keywords <span className="hint">optional, kept natural</span>
            </label>
            <input
              id="assist-keywords"
              name="keywords"
              className="a-input"
              placeholder="ai receptionist uk, lead response time"
            />
          </div>

          <div className="assistant-actions">
            <button
              type="submit"
              name="intent"
              value="draft"
              className="a-btn a-btn--primary"
              disabled={pending}
            >
              {pending ? "Working…" : "Draft a post"}
            </button>
            <button
              type="submit"
              name="intent"
              value="improve"
              className="a-btn"
              disabled={pending || body.trim().length < 40}
              title={body.trim().length < 40 ? "Write a rough draft first" : undefined}
            >
              Improve current body
            </button>
            <button
              type="submit"
              name="intent"
              value="image"
              className="a-btn"
              disabled={pending}
            >
              Generate featured image
            </button>
          </div>
        </form>

        {state.message && (
          <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`} style={{ marginTop: ".8rem" }}>
            {state.message}
          </p>
        )}

        {state.imageUrl && (
          <figure className="assistant-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.imageUrl} alt="Generated featured image" />
            <figcaption>
              Saved to Media. Copy the URL into the cover field, or leave it and pick it
              from the media library later.
            </figcaption>
          </figure>
        )}

        {state.body && (
          <div className="assistant-result">
            <div className="assistant-result-head">
              <span className="mono tiny muted">Preview</span>
              <div style={{ display: "flex", gap: ".35rem" }}>
                <button
                  type="button"
                  className="a-btn a-btn--sm"
                  onClick={() =>
                    onAdopt({
                      title: state.title,
                      excerpt: state.excerpt,
                      body: state.body,
                    })
                  }
                >
                  Use this draft
                </button>
              </div>
            </div>
            {state.title && <p className="assistant-title">{state.title}</p>}
            {state.excerpt && <p className="assistant-excerpt">{state.excerpt}</p>}
            <pre className="assistant-body">{state.body}</pre>
          </div>
        )}
      </div>

      <style>{`
        .chip-ai {
          margin-left: .5rem;
          font-family: var(--font-mono);
          font-size: .56rem;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: .18em .45em;
          border-radius: 4px;
          background: #e6e8fd;
          color: #121da8;
          vertical-align: middle;
        }
        .assistant-note {
          font-size: .76rem;
          line-height: 1.55;
          color: #6d6a5b;
          margin-bottom: .8rem;
        }
        .assistant-actions { display: flex; flex-wrap: wrap; gap: .4rem; }
        .assistant-result {
          margin-top: 1rem;
          border: 1px solid #e2dcce;
          border-radius: 8px;
          padding: .8rem;
          background: #fbf8f1;
          display: grid;
          gap: .5rem;
        }
        .assistant-result-head { display: flex; justify-content: space-between; align-items: center; }
        .assistant-title { font-weight: 600; font-size: .9rem; }
        .assistant-excerpt { font-size: .8rem; color: #6d6a5b; }
        .assistant-body {
          max-height: 18rem;
          overflow: auto;
          white-space: pre-wrap;
          font-family: var(--font-mono);
          font-size: .72rem;
          line-height: 1.55;
          color: #3d3c31;
          background: #fff;
          border: 1px solid #e2dcce;
          border-radius: 6px;
          padding: .7rem;
        }
        .assistant-image { margin-top: .8rem; display: grid; gap: .35rem; }
        .assistant-image img { border-radius: 8px; width: 100%; max-width: 28rem; }
        .assistant-image figcaption { font-size: .7rem; color: #9a9684; }
      `}</style>
    </section>
  );
}
