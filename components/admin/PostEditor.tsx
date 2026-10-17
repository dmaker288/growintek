"use client";

import { useActionState, useState } from "react";
import { savePost } from "@/lib/actions/content";
import type { ContentState } from "@/lib/action-types";
import BlogAssistant from "./BlogAssistant";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  tags: string[];
  seoTitle: string | null;
  seoDesc: string | null;
};

const initial: ContentState = { ok: false };

export default function PostEditor({ post }: { post?: Post }) {
  const [state, action, pending] = useActionState(savePost, initial);

  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");

  function adopt(patch: { title?: string; excerpt?: string; body?: string }) {
    if (patch.title) setTitle(patch.title);
    if (patch.excerpt) setExcerpt(patch.excerpt);
    if (patch.body) setBody(patch.body);
  }

  return (
    <div className="post-editor">
      <BlogAssistant title={title} body={body} onAdopt={adopt} />

      <form action={action} className="panel">
        <div className="panel-head">
          <h2 className="panel-title">{post ? "Edit post" : "New post"}</h2>
          <button type="submit" className="a-btn a-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save post"}
          </button>
        </div>

        <div className="panel-body a-form">
          {state.message && (
            <p className={`form-msg ${state.ok ? "form-msg--ok" : "form-msg--err"}`}>{state.message}</p>
          )}
          {post && <input type="hidden" name="id" value={post.id} />}

          <div className="a-field">
            <label htmlFor="post-title">
              Title <span className="hint">{title.length} characters</span>
            </label>
            <input
              id="post-title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="a-input"
              style={{ fontSize: "1rem" }}
            />
          </div>

          <div className="a-form-row">
            <div className="a-field">
              <label htmlFor="post-slug">URL slug <span className="hint">leave blank to generate</span></label>
              <input id="post-slug" name="slug" defaultValue={post?.slug} className="a-input input--mono" placeholder="what-a-good-first-reply-is-worth" />
            </div>
            <div className="a-field">
              <label htmlFor="post-tags">Tags <span className="hint">one per line</span></label>
              <input id="post-tags" name="tags" defaultValue={post?.tags.join("\n")} className="a-input" placeholder="lead response" />
            </div>
          </div>

          <div className="a-field">
            <label htmlFor="post-excerpt">
              Summary <span className="hint">used in lists, search results and the agent context</span>
            </label>
            <textarea
              id="post-excerpt"
              name="excerpt"
              required
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="a-textarea a-textarea--plain"
            />
          </div>

          <div className="a-field">
            <label htmlFor="post-body">
              Body <span className="hint">Markdown: ## heading, **bold**, *italic*, - list, &gt; quote, [link](url)</span>
            </label>
            <textarea
              id="post-body"
              name="body"
              required
              rows={24}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="a-textarea a-textarea--prose"
              placeholder={"Opening paragraph.\n\n## A heading\n\nSome **bold** text and a [link](https://example.com).\n\n- First point\n- Second point"}
            />
          </div>

          <div className="a-form-row">
            <div className="a-field">
              <label htmlFor="seoTitle">SEO title <span className="hint">≤ 70 characters</span></label>
              <input id="seoTitle" name="seoTitle" defaultValue={post?.seoTitle ?? ""} maxLength={70} className="a-input" />
            </div>
            <div className="a-field">
              <label htmlFor="seoDesc">Meta description <span className="hint">≤ 170 characters</span></label>
              <input id="seoDesc" name="seoDesc" defaultValue={post?.seoDesc ?? ""} maxLength={170} className="a-input" />
            </div>
          </div>
        </div>
        <div className="panel-foot">
          Posts are saved as drafts until you publish them from the list. Markdown is
          rendered safely — no raw HTML is ever executed.
        </div>
      </form>

      <style>{`.post-editor { display: grid; gap: 1rem; }`}</style>
    </div>
  );
}
