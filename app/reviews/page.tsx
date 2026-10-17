import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getReviewSummaries, combinedScore } from "@/lib/integrations/reviews";
import { getSocialFeeds } from "@/lib/integrations/social";
import PageHero from "@/components/site/PageHero";
import CTABand from "@/components/site/CTABand";
import Stars from "@/components/site/Stars";
import SocialFeed from "@/components/site/SocialFeed";
import ReviewShowcase from "@/components/site/ReviewShowcase";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import JsonLd from "@/components/site/JsonLd";
import {
  graph as buildGraph,
  localBusinessNode,
  organizationNode,
  reviewsNode,
  websiteNode,
} from "@/lib/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Independent reviews from Google, Trustpilot and Facebook, plus recent work from Instagram and YouTube.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const [summaries, feeds, testimonials] = await Promise.all([
    getReviewSummaries(6),
    getSocialFeeds(10),
    prisma.testimonial.findMany({
      where: { approved: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);

  const combined = combinedScore(summaries);
  const allReviews = summaries.flatMap((s) =>
    s.reviews.map((r) => ({ ...r, platformLabel: s.label }))
  );
  const hasReviews = allReviews.length > 0;
  const google = summaries.find((s) => s.platform === "GOOGLE");

  return (
    <>
      <JsonLd
        data={buildGraph([
          organizationNode(),
          websiteNode(),
          localBusinessNode({ country: "GB" }),
          hasReviews
            ? reviewsNode(allReviews, combined.score, combined.total, google?.profileUrl ?? null)
            : null,
        ])}
      />

      <PageHero
        eyebrow="Reviews"
        title={
          <>
            Reviews, straight
            <br />
            <em>from the source.</em>
          </>
        }
        lede="Pulled live from Google, Trustpilot and Facebook. Nothing is edited, and nothing appears here that a client did not write."
        aside={
          <div className="score-stack">
            {summaries.map((s) => (
              <a
                key={s.platform}
                href={s.profileUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="score-card"
              >
                <span className="score-platform">{s.label}</span>
                {s.score !== null && s.total > 0 ? (
                  <span className="score-line">
                    <span className="mono score-value">{s.score.toFixed(1)}</span>
                    <span className="tiny muted">{s.total} review{s.total === 1 ? "" : "s"}</span>
                  </span>
                ) : (
                  <span className="tiny muted">
                    {s.connected ? "No reviews yet" : "Not connected"}
                  </span>
                )}
              </a>
            ))}
          </div>
        }
      />

      <section className="section section--tight">
        <div className="wrap">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Reviews", path: "/reviews" },
            ]}
          />

          {hasReviews ? (
            <ReviewShowcase summaries={summaries} heading="Verified reviews" />
          ) : (
            <div className="review-empty">
              <div>
                <p className="eyebrow">Reviews are collected, not invented</p>
                <h2 className="display" style={{ fontSize: "var(--step-4)", marginTop: ".7rem" }}>
                  Nothing to show yet — and that is deliberate.
                </h2>
                <p className="lede" style={{ marginTop: "1rem" }}>
                  Once the Google Business Profile, Trustpilot and Facebook APIs
                  are connected and the first client reviews land, they appear
                  here automatically, as written. Until then this page stays
                  empty rather than filled with testimonials we wrote ourselves.
                </p>
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                  <Link href="/contact" className="btn btn--cobalt" data-cta="reviews-empty-book">
                    Ask for references
                  </Link>
                  <Link href="/work" className="btn btn--ghost">See the work</Link>
                </div>
              </div>
              <div className="review-empty-side">
                <p className="mono tiny">Connected platforms</p>
                <ul>
                  {summaries.map((s) => (
                    <li key={s.platform}>
                      <span className={`dot ${s.connected ? "ok" : "off"}`} />
                      {s.label}
                      <span className="tiny muted">{s.connected ? "connected" : "waiting on API"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <style>{`
          .score-stack { display: grid; gap: .5rem; min-width: 17rem; }
          .score-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            padding: .7rem .85rem;
            border: 1px solid var(--rule);
            border-radius: var(--radius);
            background: var(--paper-raised);
            text-decoration: none;
            transition: border-color var(--dur) var(--ease);
          }
          .score-card:hover { border-color: var(--cobalt); }
          .score-platform { font-size: var(--step--1); font-weight: 550; }
          .score-line { display: inline-flex; align-items: baseline; gap: .4rem; }
          .score-value { font-size: var(--step-1); }

          .review-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 1rem; border-bottom: 1px solid var(--rule-strong); padding-bottom: var(--s-4); margin-bottom: var(--s-5); }
          .review-combined { display: inline-flex; align-items: center; gap: .6rem; margin-top: .5rem; }
          .review-combined .mono { font-size: var(--step-2); }

          .review-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-4); }
          .review-card {
            display: grid;
            gap: .8rem;
            padding: var(--s-5);
            border: 1px solid var(--rule);
            border-radius: var(--radius-lg);
            background: var(--paper-raised);
            align-content: start;
          }
          .review-card-top { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
          .review-card blockquote { font-size: var(--step--1); line-height: 1.65; color: var(--ink-soft); }
          .review-card-foot { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--rule); padding-top: .7rem; margin-top: auto; }
          .reviewer { font-size: var(--step--2); font-weight: 600; }

          .review-empty { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, .8fr); gap: var(--s-7); align-items: start; padding-block: var(--s-4); }
          .review-empty-side { border: 1px solid var(--rule); border-radius: var(--radius-lg); padding: var(--s-5); background: var(--paper-raised); display: grid; gap: .9rem; }
          .review-empty-side ul { display: grid; gap: .7rem; }
          .review-empty-side li { display: grid; grid-template-columns: .75rem 1fr auto; align-items: center; gap: .5rem; font-size: var(--step--1); }
          .dot.ok { background: #4d7a3a; }
          .dot.off { background: var(--rule-strong); }

          @media (max-width: 980px) { .review-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          @media (max-width: 700px) {
            .review-grid { grid-template-columns: 1fr; }
            .review-empty { grid-template-columns: 1fr; }
          }
        `}</style>
      </section>

      {testimonials.length > 0 && (
        <section className="section section--raised section--border">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">From the project calls</p>
                <h2 style={{ marginTop: ".6rem" }}>In their words.</h2>
              </div>
            </div>
            <div className="quote-grid">
              {testimonials.map((t) => (
                <figure key={t.id} className="quote">
                  <Stars rating={t.rating} />
                  <blockquote>“{t.quote}”</blockquote>
                  <figcaption>
                    <span className="quote-name">{t.name}</span>
                    {(t.role || t.company) && (
                      <span className="tiny muted">
                        {[t.role, t.company].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <style>{`
            .quote-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-4); }
            .quote { display: grid; gap: .7rem; padding: var(--s-5); background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius-lg); align-content: start; }
            .quote blockquote { font-family: var(--font-display); font-size: var(--step-1); line-height: 1.4; }
            .quote figcaption { display: grid; gap: .1rem; font-size: var(--step--2); }
            .quote-name { font-weight: 600; }
            @media (max-width: 900px) { .quote-grid { grid-template-columns: 1fr; } }
          `}</style>
        </section>
      )}

      <SocialFeed feeds={feeds} />

      <CTABand
        title="Prefer references to reviews?"
        body="We will put you in touch with a client in your sector who has agreed to take a call. That is usually more useful than a star rating."
        cta="Ask for a reference"
        href="/contact"
      />
    </>
  );
}

function platformChip(platform: string): string {
  switch (platform) {
    case "GOOGLE":
      return "chip--cobalt";
    case "TRUSTPILOT":
      return "chip--sage";
    case "FACEBOOK":
      return "chip--clay";
    default:
      return "";
  }
}
