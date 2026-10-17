import Link from "next/link";
import { prisma } from "@/lib/db";
import { getReviewSummaries, combinedScore } from "@/lib/integrations/reviews";
import { mailto } from "@/lib/site";
import SystemMap from "@/components/site/SystemMap";
import Stars from "@/components/site/Stars";
import Reveal from "@/components/site/Reveal";

export const revalidate = 300;

const steps = [
  {
    n: "01",
    title: "Enquiry lands",
    body: "A form, a call, a DM. The agent replies in seconds and asks the three questions that actually qualify.",
    source: "Website · WhatsApp · phone",
  },
  {
    n: "02",
    title: "Agent qualifies",
    body: "Budget, timeline, postcode, service. Written to your CRM before you have opened the tab.",
    source: "AI agent · 24/7",
  },
  {
    n: "03",
    title: "You get a brief",
    body: "A short summary in your inbox: who they are, what they need, what it's worth, whether to bother.",
    source: "Email · Telegram · Slack",
  },
  {
    n: "04",
    title: "Follow-up runs itself",
    body: "No reply after two days? The system nudges. Still nothing at day seven? It closes the loop politely.",
    source: "Sequences · CRM",
  },
];

const services = [
  {
    href: "/services/websites",
    label: "Website development",
    body: "Fast, accessible, search-ready sites. Built to make the phone ring, not to win design awards.",
    note: "From £1,450",
  },
  {
    href: "/services/ai-agents",
    label: "AI agents",
    body: "Receptionists, qualifiers and first-line support that read your own content and hand off cleanly.",
    note: "From £1,900",
  },
  {
    href: "/services/automation",
    label: "Automation",
    body: "Your CRM, inbox, calendar and accounts, finally talking to each other. Fewer tabs, fewer mistakes.",
    note: "From £650",
  },
  {
    href: "/services/it-support",
    label: "IT & support",
    body: "Domains, email, hosting, backups and the security basics that nobody wants to think about.",
    note: "Care plans from £95/mo",
  },
];

export default async function HomePage() {
  const [caseStudies, testimonials, reviewSummaries, posts] = await Promise.all([
    prisma.project.findMany({
      where: { state: "PUBLISHED", type: "CASE_STUDY" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { cover: true, service: true },
    }),
    prisma.testimonial.findMany({
      where: { approved: true, featured: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    getReviewSummaries(2),
    prisma.post.findMany({
      where: { state: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  const combined = combinedScore(reviewSummaries);
  const anyReviews =
    reviewSummaries.reduce((n, s) => n + s.reviews.length, 0) > 0 || testimonials.length > 0;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow eyebrow--cobalt hero-eyebrow">
              Websites · AI agents · Automation
            </p>
            <h1 className="display hero-title">
              The website is
              <br />
              the front door.
              <br />
              <em>We build the</em>
              <br />
              <em>rest of the house.</em>
            </h1>
            <p className="lede hero-lede">
              Most businesses lose the enquiry between the form and the reply.
              GrowinTek builds the site, the agent that answers it, and the
              automation that keeps the follow-up moving — so nothing sits
              unanswered overnight.
            </p>
            <div className="hero-actions">
              <Link href="/contact" className="btn btn--cobalt" data-cta="hero-book">
                Book a 20-minute intro
                <svg width="13" height="13" viewBox="0 0 12 12" className="arrow" aria-hidden="true">
                  <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </Link>
              <Link href="/pricing" className="btn btn--ghost" data-cta="hero-pricing">
                See pricing
              </Link>
            </div>
            <div className="hero-proof">
              {combined.score !== null && combined.total > 0 ? (
                <span className="hero-proof-item">
                  <Stars rating={combined.score} />
                  <span>
                    <strong>{combined.score.toFixed(1)}</strong> across{" "}
                    {combined.total} reviews
                  </span>
                </span>
              ) : (
                <span className="hero-proof-item">
                  <span className="dot" style={{ background: "#4d7a3a" }} />
                  Taking on two new projects this month
                </span>
              )}
              <span className="hero-proof-item">
                <span className="mono tiny">Avg. first reply</span> under 1 working day
              </span>
            </div>
          </div>

          <div className="hero-art" aria-hidden="false">
            <SystemMap />
          </div>
        </div>

        <style>{`
          .hero {
            padding-block: clamp(2.5rem, 6vw, 5.5rem) clamp(2rem, 4vw, 3.5rem);
            border-bottom: 1px solid var(--rule);
            background:
              radial-gradient(60rem 30rem at 85% -10%, rgba(167, 183, 154, .2), transparent 60%),
              radial-gradient(40rem 24rem at 0% 0%, rgba(27, 44, 224, .05), transparent 70%);
          }
          .hero-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.02fr) minmax(0, 1fr);
            gap: clamp(2rem, 5vw, 4.5rem);
            align-items: center;
          }
          .hero-copy { display: grid; gap: var(--s-5); align-content: center; }
          .hero-eyebrow { margin-bottom: -.5rem; }
          .hero-title {
            font-size: var(--step-6);
            line-height: .93;
            letter-spacing: -.04em;
          }
          .hero-title em { font-size: .92em; }
          .hero-lede { max-width: 34rem; }
          .hero-actions { display: flex; flex-wrap: wrap; gap: .65rem; }
          .hero-proof {
            display: flex;
            flex-wrap: wrap;
            gap: .6rem 1.4rem;
            padding-top: var(--s-4);
            border-top: 1px solid var(--rule);
            font-size: var(--step--2);
            color: var(--ink-mute);
          }
          .hero-proof-item { display: inline-flex; align-items: center; gap: .45rem; }
          .hero-proof-item strong { color: var(--ink); font-weight: 600; }
          .hero-art { min-width: 0; }

          @media (max-width: 980px) {
            .hero-grid { grid-template-columns: 1fr; gap: var(--s-6); }
            .hero-copy { order: 1; }
            .hero-art { order: 2; }
          }
          @media (max-width: 520px) {
            .hero-actions .btn { flex: 1 1 auto; justify-content: center; }
          }
        `}</style>
      </section>

      {/* ── The sequence ─────────────────────────────────────── */}
      <section className="section section--raised" id="how">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">What happens after the click</p>
              <h2 style={{ marginTop: ".6rem" }}>
                Four steps. Each one is a place money currently leaks.
              </h2>
            </div>
            <p className="muted small" style={{ maxWidth: "26ch" }}>
              This is the sequence we build. It runs whether you are awake or
              not, and it leaves a record every time.
            </p>
          </div>

          <ol className="steps">
            {steps.map((s) => (
              <li key={s.n} className="step">
                <span className="mono step-n">{s.n}</span>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-body">{s.body}</p>
                <span className="step-source mono">{s.source}</span>
              </li>
            ))}
          </ol>
        </div>

        <style>{`
          .steps {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            border-top: 1px solid var(--rule-strong);
          }
          .step {
            padding: var(--s-5) var(--s-5) var(--s-5) 0;
            border-right: 1px solid var(--rule);
            display: grid;
            gap: .6rem;
            align-content: start;
          }
          .step + .step { padding-left: var(--s-5); }
          .step:last-child { border-right: 0; padding-right: 0; }
          .step-n { color: var(--cobalt); font-size: var(--step--2); }
          .step-title { font-family: var(--font-display); font-size: var(--step-2); }
          .step-body { font-size: var(--step--1); color: var(--ink-mute); line-height: 1.55; }
          .step-source { font-size: var(--step--2); color: var(--ink-faint); text-transform: uppercase; letter-spacing: .08em; padding-top: .4rem; }

          @media (max-width: 900px) {
            .steps { grid-template-columns: 1fr 1fr; }
            .step:nth-child(2) { border-right: 0; }
            .step:nth-child(1), .step:nth-child(2) { border-bottom: 1px solid var(--rule); }
            .step:nth-child(3) { padding-left: 0; }
          }
          @media (max-width: 560px) {
            .steps { grid-template-columns: 1fr; }
            .step { border-right: 0 !important; border-bottom: 1px solid var(--rule); padding: var(--s-4) 0 !important; }
            .step:last-child { border-bottom: 0; }
          }
        `}</style>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">What we do</p>
              <h2 style={{ marginTop: ".6rem" }}>Four things, done properly.</h2>
            </div>
            <Link href="/services" className="text-link small" data-cta="home-all-services">
              All services <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="svc-grid">
            {services.map((s) => (
              <Reveal key={s.href}>
                <Link href={s.href} className="svc" data-cta={`home-service-${s.href}`}>
                  <h3 className="svc-title">{s.label}</h3>
                  <p className="svc-body">{s.body}</p>
                  <span className="svc-note mono">{s.note}</span>
                  <span className="svc-arrow" aria-hidden="true">→</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        <style>{`
          .svc-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1px;
            background: var(--rule);
            border: 1px solid var(--rule);
            border-radius: var(--radius-lg);
            overflow: hidden;
          }
          .svc {
            position: relative;
            display: grid;
            gap: .7rem;
            padding: clamp(1.4rem, 3vw, 2.25rem);
            background: var(--paper-raised);
            text-decoration: none;
            min-height: 15rem;
            align-content: start;
            transition: background var(--dur) var(--ease);
          }
          .svc:hover { background: var(--cobalt-wash); }
          .svc-title { font-family: var(--font-display); font-size: var(--step-3); }
          .svc-body { color: var(--ink-mute); font-size: var(--step--1); line-height: 1.55; max-width: 34ch; }
          .svc-note { color: var(--ink-soft); font-size: var(--step--2); margin-top: auto; padding-top: 1rem; text-transform: uppercase; letter-spacing: .08em; }
          .svc-arrow {
            position: absolute;
            right: clamp(1.2rem, 2.5vw, 2rem);
            bottom: clamp(1.2rem, 2.5vw, 2rem);
            color: var(--cobalt);
            opacity: 0;
            transform: translateX(-4px);
            transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
          }
          .svc:hover .svc-arrow { opacity: 1; transform: none; }
          @media (max-width: 700px) {
            .svc-grid { grid-template-columns: 1fr; }
            .svc { min-height: 0; }
          }
        `}</style>
      </section>

      {/* ── Case studies ─────────────────────────────────────── */}
      {caseStudies.length > 0 && (
        <section className="section section--border">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Selected work</p>
                <h2 style={{ marginTop: ".6rem" }}>Built, launched, measured.</h2>
              </div>
              <Link href="/work" className="text-link small" data-cta="home-all-work">
                All work <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="work-grid">
              {caseStudies.map((c) => {
                const metrics = (c.metrics as { label: string; value: string }[]) ?? [];
                return (
                  <Link href={`/work/${c.slug}`} key={c.id} className="work-card" data-cta={`home-work-${c.slug}`}>
                    <div className="work-card-top">
                      <span className="chip">{c.sector}</span>
                      {c.service && <span className="tiny muted">{c.service.name}</span>}
                    </div>
                    <h3 className="work-card-title">{c.name}</h3>
                    <p className="work-card-client">{c.client}{c.location ? ` · ${c.location}` : ""}</p>
                    <p className="work-card-summary">{c.summary}</p>
                    {metrics.length > 0 && (
                      <dl className="work-metrics">
                        {metrics.slice(0, 3).map((m) => (
                          <div key={m.label}>
                            <dt>{m.label}</dt>
                            <dd>{m.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <style>{`
            .work-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-5); }
            .work-card {
              display: grid;
              gap: .75rem;
              align-content: start;
              padding: var(--s-5);
              border: 1px solid var(--rule);
              border-radius: var(--radius-lg);
              background: var(--paper-raised);
              text-decoration: none;
              transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease), transform var(--dur) var(--ease);
            }
            .work-card:hover { border-color: var(--rule-strong); box-shadow: var(--shadow-lift); transform: translateY(-2px); }
            .work-card-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
            .work-card-title { font-family: var(--font-display); font-size: var(--step-2); margin-top: .2rem; }
            .work-card-client { font-size: var(--step--2); color: var(--ink-mute); text-transform: uppercase; letter-spacing: .08em; font-family: var(--font-mono); }
            .work-card-summary { font-size: var(--step--1); color: var(--ink-soft); line-height: 1.55; }
            .work-metrics {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: .5rem;
              border-top: 1px solid var(--rule);
              padding-top: .9rem;
              margin-top: .35rem;
            }
            .work-metrics div { display: grid; gap: .15rem; }
            .work-metrics dt { font-size: var(--step--2); color: var(--ink-mute); line-height: 1.25; }
            .work-metrics dd { font-family: var(--font-mono); font-size: var(--step-0); font-weight: 500; }
            @media (max-width: 900px) { .work-grid { grid-template-columns: 1fr; } }
          `}</style>
        </section>
      )}

      {/* ── Reviews ──────────────────────────────────────────── */}
      {anyReviews && (
        <section className="section section--raised">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Reviews</p>
                <h2 style={{ marginTop: ".6rem" }}>
                  {combined.score !== null ? `${combined.score.toFixed(1)} out of 5` : "What clients say"}
                </h2>
              </div>
              <Link href="/reviews" className="text-link small" data-cta="home-all-reviews">
                All reviews <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="rev-row">
              {testimonials.map((t) => (
                <figure className="rev" key={t.id}>
                  <Stars rating={t.rating} />
                  <blockquote>“{t.quote}”</blockquote>
                  <figcaption>
                    <span className="rev-name">{t.name}</span>
                    {(t.role || t.company) && (
                      <span className="rev-role">
                        {[t.role, t.company].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
              {testimonials.length === 0 &&
                reviewSummaries
                  .flatMap((s) => s.reviews)
                  .slice(0, 3)
                  .map((r) => (
                    <figure className="rev" key={`${r.platform}-${r.externalId}`}>
                      <Stars rating={r.rating} />
                      <blockquote>“{r.text}”</blockquote>
                      <figcaption>
                        <span className="rev-name">{r.authorName}</span>
                        <span className="rev-role">{r.platform}</span>
                      </figcaption>
                    </figure>
                  ))}
            </div>
          </div>

          <style>{`
            .rev-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-5); }
            .rev {
              display: grid;
              gap: .8rem;
              align-content: start;
              padding: var(--s-5);
              background: var(--paper);
              border-radius: var(--radius-lg);
              border: 1px solid var(--rule);
            }
            .rev blockquote {
              font-family: var(--font-display);
              font-size: var(--step-1);
              line-height: 1.4;
              letter-spacing: -.01em;
              color: var(--ink);
            }
            .rev figcaption { display: grid; gap: .1rem; font-size: var(--step--2); }
            .rev-name { font-weight: 600; }
            .rev-role { color: var(--ink-mute); }
            @media (max-width: 900px) { .rev-row { grid-template-columns: 1fr; } }
          `}</style>
        </section>
      )}

      {/* ── Journal ──────────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Journal</p>
                <h2 style={{ marginTop: ".6rem" }}>Notes from the build.</h2>
              </div>
              <Link href="/journal" className="text-link small" data-cta="home-all-journal">
                All posts <span aria-hidden="true">→</span>
              </Link>
            </div>

            <ul className="post-list">
              {posts.map((p, i) => (
                <li key={p.id}>
                  <Link href={`/journal/${p.slug}`} className="post-row" data-cta={`home-post-${p.slug}`}>
                    <span className="mono post-index">{String(i + 1).padStart(2, "0")}</span>
                    <span className="post-main">
                      <span className="post-title">{p.title}</span>
                      <span className="post-excerpt">{p.excerpt}</span>
                    </span>
                    <span className="post-meta mono">
                      {p.publishedAt
                        ? new Date(p.publishedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                        : "Draft"}
                      <span aria-hidden="true"> · </span>
                      {p.readingMins} min
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <style>{`
            .post-list { border-top: 1px solid var(--rule-strong); }
            .post-list > li { border-bottom: 1px solid var(--rule); }
            .post-row {
              display: grid;
              grid-template-columns: 3rem minmax(0, 1fr) auto;
              gap: var(--s-4);
              align-items: baseline;
              padding: 1.25rem 0;
              text-decoration: none;
              transition: background var(--dur) var(--ease), padding-left var(--dur) var(--ease);
            }
            .post-row:hover { background: var(--paper-raised); padding-left: .75rem; }
            .post-index { color: var(--ink-faint); font-size: var(--step--2); }
            .post-main { display: grid; gap: .25rem; }
            .post-title { font-family: var(--font-display); font-size: var(--step-2); letter-spacing: -.02em; }
            .post-excerpt { font-size: var(--step--1); color: var(--ink-mute); max-width: 60ch; }
            .post-meta { font-size: var(--step--2); color: var(--ink-faint); white-space: nowrap; }
            @media (max-width: 640px) {
              .post-row { grid-template-columns: 2rem minmax(0, 1fr); }
              .post-meta { grid-column: 2; }
            }
          `}</style>
        </section>
      )}

      {/* ── Close ────────────────────────────────────────────── */}
      <section className="section section--ink close">
        <div className="wrap close-grid">
          <div>
            <p className="eyebrow">Next step</p>
            <h2 className="display close-title">
              Tell us what is
              <br />
              <em>falling through.</em>
            </h2>
            <p className="lede close-lede">
              Twenty minutes, no slide deck. We ask what happens between an
              enquiry arriving and someone replying, and tell you honestly
              whether a system would fix it — or whether you just need a
              better website.
            </p>
            <div className="close-actions">
              <Link href="/contact" className="btn btn--cobalt" data-cta="home-close-book">
                Book the intro call
              </Link>
              <a href={mailto()} className="btn btn--ghost close-mail" data-cta="home-close-email">
                Email instead
              </a>
            </div>
          </div>
          <div className="close-facts">
            <div>
              <span className="mono">01</span>
              <p>You talk to the person who builds it. No account manager.</p>
            </div>
            <div>
              <span className="mono">02</span>
              <p>Fixed price before work starts. If scope changes, you approve it first.</p>
            </div>
            <div>
              <span className="mono">03</span>
              <p>Launch in two to six weeks depending on scope. Weekly demo, no black box.</p>
            </div>
          </div>
        </div>

        <style>{`
          .close-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
            gap: var(--s-8);
            align-items: start;
          }
          .close-title { font-size: var(--step-5); color: var(--paper); }
          .close-title em { color: var(--sage); }
          .close-lede { color: #b8b3a2; margin-top: var(--s-4); }
          .close-actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: var(--s-5); }
          .close-mail { border-color: #3a3a30; color: var(--paper); }
          .close-mail:hover { border-color: var(--paper); background: #1e1f17; color: var(--paper); }
          .close-facts { display: grid; gap: var(--s-5); padding-top: var(--s-4); }
          .close-facts > div { display: grid; grid-template-columns: 3rem 1fr; gap: var(--s-3); border-top: 1px solid #2b2c22; padding-top: var(--s-4); }
          .close-facts .mono { color: var(--sage); font-size: var(--step--2); }
          .close-facts p { font-size: var(--step--1); color: #b8b3a2; line-height: 1.6; }
          @media (max-width: 860px) { .close-grid { grid-template-columns: 1fr; gap: var(--s-6); } }
        `}</style>
      </section>
    </>
  );
}
