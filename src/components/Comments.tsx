import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { PublicSettings } from "../types";
import SocialIcon from "./SocialIcon";
import Icon from "./Icon";
import { hasCommentLink } from "../../shared/comment-policy.js";

type Comment = { id: string; name: string; body: string; createdAt: string };
const labels: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
};
export default function Comments({
  postId,
  settings,
}: {
  postId: string;
  settings: PublicSettings;
}) {
  const [comments, setComments] = useState<Comment[]>([]),
    [loadError, setLoadError] = useState(false);
  const [opened, setOpened] = useState<string[]>([]),
    [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const profiles = Object.entries(labels).filter(([key]) =>
    Boolean(settings.social[key as keyof typeof settings.social]),
  );
  const allOpened = profiles.every(([key]) => opened.includes(key));
  useEffect(() => {
    const abort = new AbortController();
    fetch(`/api/posts/${postId}/comments`, { signal: abort.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setComments(d.comments))
      .catch(() => {
        if (!abort.signal.aborted) setLoadError(true);
      });
    return () => abort.abort();
  }, [postId]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!allOpened || !confirmed) {
      setError("Open the social profiles and confirm your follows first.");
      return;
    }
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (hasCommentLink(values.body) || hasCommentLink(values.name)) {
      setError(
        "Please remove links, web addresses and markup from your comment and name.",
      );
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, postId, followsConfirmed: true }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error || "Your comment could not be submitted.");
      setMessage(d.message);
      form.current?.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="comments-section section-space"
      aria-labelledby="comments-heading"
    >
      <div className="container comments-layout">
        <div className="comments-intro">
          <span className="section-label">KEEP THE CONVERSATION GOING</span>
          <h2 id="comments-heading">
            Your perspective
            <br />
            belongs here.
          </h2>
          <p>
            Have a question or an experience to share? Join our community and
            add something useful to the conversation.
          </p>
          <div className="comment-guidelines">
            <Icon name="shield" />
            <p>
              Thoughtful discussion, no links or promotions. Every comment is
              reviewed before it appears.
            </p>
          </div>
          <div className="published-comments" aria-live="polite">
            <h3>
              {comments.length
                ? `${comments.length} approved comment${comments.length === 1 ? "" : "s"}`
                : "Start a conversation"}
            </h3>
            {loadError ? (
              <p>Comments could not load. Refresh the page to try again.</p>
            ) : comments.length ? (
              comments.map((c) => (
                <article key={c.id}>
                  <span className="comment-avatar">
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <h4>{c.name}</h4>
                    <time dateTime={c.createdAt}>
                      {new Date(c.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                    <p>{c.body}</p>
                  </div>
                </article>
              ))
            ) : (
              <p>Be the first to share a useful question or idea.</p>
            )}
          </div>
        </div>
        <div className="comment-panel">
          {message ? (
            <div className="comment-success" role="status">
              <Icon name="check" />
              <h3>Thanks for joining in.</h3>
              <p>{message}</p>
            </div>
          ) : (
            <>
              <div className="comment-step">
                <span>01</span>
                <div>
                  <h3>Connect with the community</h3>
                  <p>
                    Open each profile below and follow Growintek. Each button
                    opens immediately in a new tab.
                  </p>
                </div>
              </div>
              <div className="comment-follow-links">
                {profiles.map(([key, label]) => (
                  <a
                    key={key}
                    href={settings.social[key as keyof typeof settings.social]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      setOpened((v) => (v.includes(key) ? v : [...v, key]))
                    }
                  >
                    <SocialIcon name={key} />
                    <span>{label}</span>
                    {opened.includes(key) ? (
                      <small>Opened ✓</small>
                    ) : (
                      <Icon name="arrow" />
                    )}
                  </a>
                ))}
              </div>
              <label className="comment-confirm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={!allOpened}
                />
                <span>I confirm that I follow these Growintek accounts.</span>
              </label>
              <p className="comment-hint">
                This is your confirmation. Opening a profile does not verify a
                follow.
              </p>
              <div className="comment-step">
                <span>02</span>
                <div>
                  <h3>Share your thoughts</h3>
                  <p>
                    Your email stays private. Your name and approved comment
                    will be public.
                  </p>
                </div>
              </div>
              <form ref={form} onSubmit={submit}>
                <div className="comment-fields">
                  <label>
                    Your name
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                    />
                  </label>
                </div>
                <label>
                  Your comment
                  <textarea
                    name="body"
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={5}
                    placeholder="What would you add to this conversation?"
                  />
                </label>
                <label className="honey" aria-hidden="true">
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
                {error ? (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  className="button button-gold"
                  disabled={!allOpened || !confirmed || busy}
                >
                  {busy ? "Sending…" : "Send for approval"}
                  <Icon name="arrow" />
                </button>
                <p className="comment-hint">
                  By submitting, you agree to our{" "}
                  <a href="/privacy-policy">Privacy Policy</a> and{" "}
                  <a href="/terms">comment guidelines</a>.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
