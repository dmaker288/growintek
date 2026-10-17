import type { ReviewSummary } from "@/lib/integrations/types";
import Stars from "./Stars";

/**
 * The reviews block. Editorial at the top, app-like below: a large score,
 * a distribution rail, then cards that read like a native review feed on a
 * phone without becoming a carousel nobody can operate by keyboard.
 */
export default function ReviewShowcase({
  summaries,
  heading = "What clients say",
  compact = false,
}: {
  summaries: ReviewSummary[];
  heading?: string;
  compact?: boolean;
}) {
  const reviews = summaries.flatMap((s) =>
    s.reviews.map((r) => ({ ...r, platformLabel: s.label }))
  );

  if (reviews.length === 0) return null;

  const withScore = summaries.filter((s) => s.score !== null && s.total > 0);
  const total = withScore.reduce((s, x) => s + x.total, 0);
  const combined =
    total > 0
      ? Math.round(
          (withScore.reduce((s, x) => s + (x.score ?? 0) * x.total, 0) / total) * 10
        ) / 10
      : null;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  const shown = compact ? reviews.slice(0, 3) : reviews.slice(0, 6);

  return (
    <section className="rshow" aria-labelledby="rshow-title">
      <div className="rshow-top">
        <div className="rshow-score">
          <p className="eyebrow">{heading}</p>
          <div className="rshow-big">
            <span className="rshow-number">{combined !== null ? combined.toFixed(1) : "—"}</span>
            <div className="rshow-score-meta">
              {combined !== null && <Stars rating={combined} size={16} />}
              <span className="tiny muted">
                {total > 0 ? `${total} reviews across ${withScore.length} platforms` : "Live reviews"}
              </span>
            </div>
          </div>
        </div>

        <ul className="rshow-dist" aria-label="Star distribution of displayed reviews">
          {distribution.map((d) => (
            <li key={d.star}>
              <span className="rshow-star mono">{d.star}</span>
              <span className="rshow-track">
                <span
                  className="rshow-fill"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </span>
              <span className="rshow-count mono">{d.count}</span>
            </li>
          ))}
        </ul>

        <div className="rshow-platforms">
          {summaries.map((s) => (
            <a
              key={s.platform}
              href={s.profileUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="rshow-platform"
            >
              <span>{s.label}</span>
              <span className="mono">
                {s.score !== null && s.total > 0
                  ? `${s.score.toFixed(1)} · ${s.total}`
                  : s.connected
                    ? "no reviews"
                    : "not connected"}
              </span>
            </a>
          ))}
        </div>
      </div>

      <ul className="rshow-grid">
        {shown.map((r) => (
          <li key={`${r.platform}-${r.externalId}`} className="rshow-card">
            <div className="rshow-card-top">
              <Stars rating={r.rating} />
              <span className={`rshow-chip rshow-chip--${r.platform.toLowerCase()}`}>
                {r.platformLabel}
              </span>
            </div>
            <blockquote className="rshow-quote">{r.text}</blockquote>
            <div className="rshow-foot">
              <span className="rshow-author">
                {r.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.avatarUrl} alt="" width={24} height={24} loading="lazy" />
                ) : (
                  <span className="rshow-initial" aria-hidden="true">
                    {r.authorName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                {r.authorName}
              </span>
              <span className="tiny muted mono">
                {new Date(r.reviewedAt).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <style>{`
        .rshow { display: grid; gap: var(--s-5); }
        .rshow-top {
          display: grid;
          grid-template-columns: auto minmax(12rem, 1fr) auto;
          gap: var(--s-6);
          align-items: center;
          padding: var(--s-5);
          border: 1px solid var(--rule);
          border-radius: var(--radius-lg);
          background: var(--paper-raised);
        }
        .rshow-score { display: grid; gap: .5rem; }
        .rshow-big { display: flex; align-items: center; gap: .9rem; }
        .rshow-number {
          font-family: var(--font-display);
          font-size: clamp(2.6rem, 5vw, 3.6rem);
          letter-spacing: -.04em;
          line-height: .9;
          color: var(--ink);
        }
        .rshow-score-meta { display: grid; gap: .25rem; }

        .rshow-dist { display: grid; gap: .3rem; min-width: 0; }
        .rshow-dist li { display: grid; grid-template-columns: 1rem 1fr 1.2rem; gap: .5rem; align-items: center; }
        .rshow-star { font-size: .62rem; color: var(--ink-mute); }
        .rshow-track { height: 5px; background: var(--paper-sunk); border-radius: 999px; overflow: hidden; }
        .rshow-fill { display: block; height: 100%; background: #8a6a12; border-radius: 999px; min-width: 2px; }
        .rshow-count { font-size: .6rem; color: var(--ink-faint); text-align: right; }

        .rshow-platforms { display: grid; gap: .35rem; min-width: 11rem; }
        .rshow-platform {
          display: flex;
          justify-content: space-between;
          gap: .75rem;
          padding: .4rem .6rem;
          border: 1px solid var(--rule);
          border-radius: var(--radius);
          background: var(--paper);
          text-decoration: none;
          font-size: var(--step--2);
          color: var(--ink-soft);
          transition: border-color var(--dur) var(--ease);
        }
        .rshow-platform:hover { border-color: var(--cobalt); }
        .rshow-platform .mono { color: var(--ink-mute); font-size: .62rem; }

        .rshow-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--s-4);
        }
        .rshow-card {
          display: grid;
          gap: .7rem;
          padding: var(--s-4);
          border: 1px solid var(--rule);
          border-radius: var(--radius-lg);
          background: var(--paper-raised);
          align-content: start;
        }
        .rshow-card-top { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
        .rshow-chip {
          font-family: var(--font-mono);
          font-size: .55rem;
          text-transform: uppercase;
          letter-spacing: .08em;
          padding: .2em .5em;
          border-radius: 999px;
        }
        .rshow-chip--google { background: var(--cobalt-wash); color: var(--cobalt-deep); }
        .rshow-chip--trustpilot { background: var(--sage-wash); color: #3e5233; }
        .rshow-chip--facebook { background: var(--clay-wash); color: #7d3d20; }
        .rshow-chip--direct { background: var(--paper-sunk); color: var(--ink-mute); }
        .rshow-quote {
          font-size: var(--step--1);
          line-height: 1.6;
          color: var(--ink-soft);
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .rshow-foot { display: flex; align-items: center; justify-content: space-between; gap: .5rem; border-top: 1px solid var(--rule); padding-top: .6rem; margin-top: auto; }
        .rshow-author { display: inline-flex; align-items: center; gap: .4rem; font-size: var(--step--2); font-weight: 600; min-width: 0; }
        .rshow-author img { border-radius: 50%; object-fit: cover; }
        .rshow-initial {
          display: grid; place-items: center;
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--paper-sunk); color: var(--ink-soft);
          font-size: .65rem; font-weight: 600;
        }

        @media (max-width: 1000px) {
          .rshow-top { grid-template-columns: 1fr 1fr; }
          .rshow-platforms { grid-column: 1 / -1; grid-template-columns: repeat(3, minmax(0,1fr)); }
          .rshow-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 700px) {
          .rshow-top { grid-template-columns: 1fr; gap: var(--s-4); }
          .rshow-platforms { grid-template-columns: 1fr; }
          .rshow-grid {
            grid-template-columns: none;
            grid-auto-flow: column;
            grid-auto-columns: 82%;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: .75rem;
            margin-inline: calc(var(--gutter) * -1);
            padding-inline: var(--gutter);
            padding-bottom: .5rem;
            scrollbar-width: none;
          }
          .rshow-grid::-webkit-scrollbar { display: none; }
          .rshow-card { scroll-snap-align: start; }
        }
      `}</style>
    </section>
  );
}
