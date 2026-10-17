"use client";

import { useMemo, useState } from "react";
import type { SocialFeed as Feed, SocialPlatform } from "@/lib/integrations/types";

const TABS: { id: SocialPlatform; label: string; short: string }[] = [
  { id: "instagram", label: "Instagram", short: "IG" },
  { id: "youtube", label: "Shorts", short: "YT" },
  { id: "facebook", label: "Facebook", short: "FB" },
];

export default function SocialFeed({ feeds }: { feeds: Feed[] }) {
  const live = feeds.filter((f) => f.posts.length > 0);
  const [tab, setTab] = useState<SocialPlatform>(
    (live[0]?.platform as SocialPlatform) ?? "instagram"
  );

  const active = useMemo(
    () => feeds.find((f) => f.platform === tab) ?? feeds[0],
    [feeds, tab]
  );

  if (live.length === 0) return null;

  return (
    <section className="section social" id="social" aria-labelledby="social-heading">
      <div className="wrap">
        <div className="section-head social-head">
          <div>
            <p className="eyebrow">Recently posted</p>
            <h2 id="social-heading" style={{ marginTop: ".6rem" }}>
              From the feed.
            </h2>
          </div>

          <div className="segmented" role="tablist" aria-label="Social feeds">
            {TABS.map((t) => {
              const feed = feeds.find((f) => f.platform === t.id);
              const disabled = !feed || feed.posts.length === 0;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls={`feed-${t.id}`}
                  id={`tab-${t.id}`}
                  className={`seg ${tab === t.id ? "seg--on" : ""}`}
                  onClick={() => setTab(t.id)}
                  disabled={disabled}
                  type="button"
                >
                  {t.label}
                  {feed && feed.posts.length > 0 && (
                    <span className="seg-count">{feed.posts.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {active && active.posts.length === 0 && (
          <p className="muted small">Nothing on this platform yet.</p>
        )}

        {active && active.posts.length > 0 && (
          <div
            id={`feed-${active.platform}`}
            role="tabpanel"
            aria-labelledby={`tab-${active.platform}`}
            className={`feed feed--${active.platform}`}
          >
            {active.platform === "instagram" && (
              <ul className="ig-grid">
                {active.posts.map((p) => (
                  <li key={p.externalId} className="ig-cell">
                    <a
                      href={p.permalink ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ig-link"
                      aria-label={p.caption ?? "Open Instagram post"}
                    >
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.caption ?? ""}
                          loading="lazy"
                          decoding="async"
                          className="ig-img"
                        />
                      ) : (
                        <span className="ig-fallback" aria-hidden="true">GT</span>
                      )}
                      <span className="ig-overlay">
                        {p.kind === "reel" && <span className="ig-badge">Reel</span>}
                        {p.caption && <span className="ig-caption">{p.caption}</span>}
                        {p.metrics?.likes !== undefined && (
                          <span className="ig-metrics mono">
                            ♥ {formatCount(p.metrics.likes)}
                          </span>
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {active.platform === "youtube" && (
              <div className="shorts-rail" role="list">
                {active.posts.map((p) => (
                  <a
                    key={p.externalId}
                    href={p.permalink ?? p.mediaUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="short-card"
                    role="listitem"
                  >
                    <span className="short-thumb-wrap">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.caption ?? ""}
                          loading="lazy"
                          decoding="async"
                          className="short-thumb"
                        />
                      ) : (
                        <span className="short-fallback" aria-hidden="true" />
                      )}
                      <span className="short-play" aria-hidden="true">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="11" fill="rgba(20,21,15,.55)" />
                          <path d="M9.5 7.8v8.4l7-4.2-7-4.2Z" fill="#fff" />
                        </svg>
                      </span>
                      {p.kind === "short" && <span className="short-badge mono">Shorts</span>}
                      {p.metrics?.views !== undefined && (
                        <span className="short-views mono">{formatCount(p.metrics.views)} views</span>
                      )}
                    </span>
                    <span className="short-title">{p.caption}</span>
                  </a>
                ))}
              </div>
            )}

            {active.platform === "facebook" && (
              <ul className="fb-list">
                {active.posts.map((p) => (
                  <li key={p.externalId} className="fb-card">
                    <div className="fb-head">
                      <span className="fb-avatar" aria-hidden="true">G</span>
                      <div>
                        <span className="fb-name">GrowinTek</span>
                        <span className="fb-date tiny muted">
                          {new Date(p.postedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    {p.caption && <p className="fb-text">{p.caption}</p>}
                    {p.thumbnailUrl && (
                      <a href={p.permalink ?? "#"} target="_blank" rel="noopener noreferrer">
                        <img
                          src={p.thumbnailUrl}
                          alt={p.caption ?? "Facebook post"}
                          loading="lazy"
                          decoding="async"
                          className="fb-img"
                        />
                      </a>
                    )}
                    {p.permalink && (
                      <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="text-link small">
                        View on Facebook <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <style>{`
        .social { border-top: 1px solid var(--rule); }
        .social-head { align-items: center; margin-bottom: var(--s-5); }

        .segmented {
          display: inline-flex;
          padding: 3px;
          gap: 2px;
          background: var(--paper-sunk);
          border: 1px solid var(--rule);
          border-radius: var(--radius-pill);
        }
        .seg {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          min-height: 36px;
          padding: 0 .9rem;
          border-radius: var(--radius-pill);
          font-size: var(--step--1);
          font-weight: 500;
          color: var(--ink-mute);
          transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
        }
        .seg:hover:not(:disabled) { color: var(--ink); }
        .seg--on { background: var(--paper-raised); color: var(--ink); box-shadow: 0 1px 2px rgba(20,21,15,.1); }
        .seg:disabled { opacity: .4; cursor: not-allowed; }
        .seg-count { font-family: var(--font-mono); font-size: .62rem; color: var(--ink-faint); }

        /* Instagram grid */
        .ig-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 6px;
        }
        .ig-cell { aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: var(--paper-sunk); }
        .ig-link {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          text-decoration: none;
        }
        .ig-img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s var(--ease); }
        .ig-link:hover .ig-img { transform: scale(1.04); }
        .ig-fallback { display: grid; place-items: center; width: 100%; height: 100%; font-family: var(--font-display); font-size: 1.5rem; color: var(--ink-faint); }
        .ig-overlay {
          position: absolute;
          inset: auto 0 0 0;
          padding: 1.5rem .55rem .5rem;
          background: linear-gradient(to top, rgba(20,21,15,.72), transparent);
          color: #fff;
          display: grid;
          gap: .2rem;
          opacity: 0;
          transition: opacity var(--dur) var(--ease);
        }
        .ig-link:hover .ig-overlay,
        .ig-link:focus-visible .ig-overlay { opacity: 1; }
        .ig-caption {
          font-size: .64rem;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ig-metrics { font-size: .6rem; opacity: .85; }
        .ig-badge {
          justify-self: start;
          font-size: .55rem;
          text-transform: uppercase;
          letter-spacing: .1em;
          padding: .15em .45em;
          border: 1px solid rgba(255,255,255,.5);
          border-radius: 999px;
        }

        /* Shorts carousel */
        .shorts-rail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(9.5rem, 11rem);
          gap: .65rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding-bottom: .5rem;
          margin-inline: calc(var(--gutter) * -1);
          padding-inline: var(--gutter);
          overscroll-behavior-x: contain;
        }
        .shorts-rail::-webkit-scrollbar { display: none; }
        .short-card {
          scroll-snap-align: start;
          display: grid;
          gap: .45rem;
          text-decoration: none;
        }
        .short-thumb-wrap {
          position: relative;
          display: block;
          aspect-ratio: 9 / 16;
          border-radius: 10px;
          overflow: hidden;
          background: var(--paper-sunk);
          border: 1px solid var(--rule);
        }
        .short-thumb { width: 100%; height: 100%; object-fit: cover; }
        .short-fallback { display: block; width: 100%; height: 100%; background: linear-gradient(160deg, var(--cobalt-wash), var(--paper-sunk)); }
        .short-play {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          opacity: .9;
          transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
        }
        .short-card:hover .short-play { opacity: 1; transform: scale(1.06); }
        .short-badge {
          position: absolute;
          top: .4rem;
          left: .4rem;
          font-size: .55rem;
          letter-spacing: .1em;
          text-transform: uppercase;
          background: rgba(255,255,255,.92);
          color: var(--ink);
          padding: .18em .45em;
          border-radius: 4px;
        }
        .short-views {
          position: absolute;
          bottom: .4rem;
          left: .4rem;
          font-size: .58rem;
          color: #fff;
          background: rgba(20,21,15,.6);
          padding: .15em .4em;
          border-radius: 999px;
        }
        .short-title {
          font-size: .72rem;
          line-height: 1.35;
          color: var(--ink-soft);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Facebook */
        .fb-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-4); }
        .fb-card {
          display: grid;
          gap: .75rem;
          padding: var(--s-4);
          background: var(--paper-raised);
          border: 1px solid var(--rule);
          border-radius: var(--radius-lg);
          align-content: start;
        }
        .fb-head { display: flex; align-items: center; gap: .6rem; }
        .fb-avatar {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--ink);
          color: var(--paper);
          font-family: var(--font-display);
          font-size: 1rem;
        }
        .fb-head > div { display: grid; }
        .fb-name { font-size: var(--step--1); font-weight: 600; }
        .fb-text { font-size: var(--step--1); line-height: 1.55; color: var(--ink-soft); }
        .fb-img { width: 100%; border-radius: 8px; }

        @media (max-width: 860px) {
          .ig-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .social-head { align-items: flex-start; }
        }
        @media (max-width: 640px) {
          .fb-list { grid-template-columns: 1fr; }
          .segmented { width: 100%; }
          .seg { flex: 1; justify-content: center; padding: 0 .5rem; }
          .shorts-rail { grid-auto-columns: 8.5rem; }
        }
      `}</style>
    </section>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
