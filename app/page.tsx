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
    label: "Web Engineering",
    tagline: "Sub-second Next.js web applications built to convert.",
    body: "Next.js 15, edge rendering, ultra-responsive UI, and zero-latency performance designed to turn cold traffic into paying accounts.",
    note: "From $1,950",
    badge: "Core Service",
  },
  {
    href: "/services/ai-agents",
    label: "Autonomous AI Agents",
    tagline: "24/7 conversational agents that qualify and close.",
    body: "Trained on your knowledgebase, voice, and CRM. Answers queries, qualifies budgets, schedules calendar calls, and updates pipelines autonomously.",
    note: "From $2,400",
    badge: "High ROI",
  },
  {
    href: "/services/ai-seo",
    label: "AEO & Technical SEO",
    tagline: "Rank #1 in Google, ChatGPT & Perplexity AI search.",
    body: "Engineered for Answer Engine Optimization (AEO) and semantic schema markup to capture organic search and AI answer engine recommendations.",
    note: "From $1,200/mo",
    badge: "Market Trend",
  },
  {
    href: "/services/automation",
    label: "Revenue Automation",
    tagline: "Zero-touch pipelines connecting your CRM and tools.",
    body: "Stripe, HubSpot, Slack, WhatsApp, and PostgreSQL seamlessly synced. Automated invoicing, follow-up drip loops, and telemetry dashboards.",
    note: "From $850",
    badge: "Efficiency",
  },
  {
    href: "/services/growth-ads",
    label: "Paid Ads (Google & Meta)",
    tagline: "Hyper-targeted campaigns with high conversion ROI.",
    body: "Data-driven ad creatives, dynamic retargeting, conversion tracking pixels, and conversion rate optimization (CRO) that compound sales.",
    note: "From $1,500/mo",
    badge: "Growth Engine",
  },
  {
    href: "/services/it-support",
    label: "Cloud & IT Infrastructure",
    tagline: "Cloud edge, security audits, backups and uptime SLA.",
    body: "High-availability AWS/Vercel setups, CDN routing, automated database backups, security hardening, and dedicated 99.9% uptime SLA.",
    note: "Care plans from $149/mo",
    badge: "24/7 Monitored",
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
        <div className="hero-glow-orb hero-glow-orb--cyan" aria-hidden="true" />
        <div className="hero-glow-orb hero-glow-orb--cobalt" aria-hidden="true" />

        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="hero-badge-wrap">
              <span className="hero-badge">
                <span className="dot dot--pulse" aria-hidden="true" />
                Next-Gen Web, Autonomous AI & Growth Systems
              </span>
            </div>

            <h1 className="display hero-title">
              Engineering web apps &
              <br />
              <span className="text-gradient">AI agents</span> that
              <br />
              <em>scale enterprise revenue.</em>
            </h1>

            <p className="lede hero-lede">
              Most businesses lose leads between the first visit and the sales reply.
              GrowinTek builds lightning-fast Next.js platforms, autonomous AI qualifying agents,
              and automated revenue pipelines so no opportunity slips away.
            </p>

            <div className="hero-actions">
              <Link href="/contact" className="btn btn--shine shine-sweep" data-cta="hero-book">
                Book a 20-minute intro
                <svg width="13" height="13" viewBox="0 0 12 12" className="arrow" aria-hidden="true">
                  <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </Link>
              <Link href="/pricing" className="btn btn--ghost" data-cta="hero-pricing">
                Explore transparent pricing
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
                  <span className="dot" style={{ background: "#00f5d4" }} />
                  Taking on select enterprise clients this quarter
                </span>
              )}
              <span className="hero-proof-item">
                <span className="mono tiny">Avg. response time</span> &lt; 2 minutes
              </span>
              <span className="hero-proof-item">
                <span className="mono tiny">Production uptime</span> 99.98% SLA
              </span>
            </div>
          </div>

          <div className="hero-art" aria-hidden="false">
            <div className="hero-art-frame">
              <SystemMap />
            </div>
          </div>
        </div>

        {/* Dynamic Tech Stack & Trust Ticker */}
        <div className="hero-ticker" aria-label="Technology and performance highlights">
          <div className="hero-ticker-track">
            <span>Next.js 15 & React 19</span>
            <span className="ticker-sep">✦</span>
            <span>Autonomous Claude & OpenAI Agents</span>
            <span className="ticker-sep">✦</span>
            <span>AEO / AI Search Engine Optimization</span>
            <span className="ticker-sep">✦</span>
            <span>Sub-50ms Edge Latency</span>
            <span className="ticker-sep">✦</span>
            <span>Stripe & PostgreSQL Pipelines</span>
            <span className="ticker-sep">✦</span>
            <span>Enterprise Security Hardened</span>
            <span className="ticker-sep">✦</span>
            <span>Next.js 15 & React 19</span>
            <span className="ticker-sep">✦</span>
            <span>Autonomous Claude & OpenAI Agents</span>
            <span className="ticker-sep">✦</span>
            <span>AEO / AI Search Engine Optimization</span>
            <span className="ticker-sep">✦</span>
            <span>Sub-50ms Edge Latency</span>
            <span className="ticker-sep">✦</span>
            <span>Stripe & PostgreSQL Pipelines</span>
            <span className="ticker-sep">✦</span>
            <span>Enterprise Security Hardened</span>
          </div>
        </div>

        <style>{`
          .hero {
            position: relative;
            overflow: hidden;
            padding-top: clamp(3rem, 7vw, 6.5rem);
            padding-bottom: clamp(2.5rem, 5vw, 4.5rem);
            border-bottom: 1px solid var(--rule);
            background:
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.25), transparent 70%),
              radial-gradient(circle at 10% 20%, rgba(0, 245, 212, 0.12), transparent 45%),
              linear-gradient(180deg, #030712 0%, #080e22 100%);
          }
          .hero-glow-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
            z-index: 0;
            animation: pulseGlow 8s infinite alternate ease-in-out;
          }
          .hero-glow-orb--cyan {
            top: 5%;
            left: 5%;
            width: 320px;
            height: 320px;
            background: rgba(0, 245, 212, 0.15);
          }
          .hero-glow-orb--cobalt {
            top: 15%;
            right: 10%;
            width: 440px;
            height: 440px;
            background: rgba(37, 99, 235, 0.2);
            animation-delay: -4s;
          }
          .hero-grid {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr);
            gap: clamp(2.5rem, 6vw, 5rem);
            align-items: center;
          }
          .hero-copy { display: grid; gap: var(--s-5); align-content: center; }
          .hero-badge-wrap { display: flex; align-items: center; }
          .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.4rem 0.9rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(0, 245, 212, 0.3);
            border-radius: 999px;
            font-size: var(--step--2);
            font-family: var(--font-mono);
            color: var(--cyan);
            letter-spacing: 0.04em;
            text-transform: uppercase;
            box-shadow: 0 0 15px -3px rgba(0, 245, 212, 0.2);
          }
          .dot--pulse {
            background: var(--cyan);
            box-shadow: 0 0 8px var(--cyan);
            animation: pulseGlow 2s infinite ease-in-out;
          }
          .hero-title {
            font-size: clamp(2.4rem, 4.2vw, 4.4rem);
            line-height: 1.02;
            letter-spacing: -.035em;
            font-weight: 600;
          }
          .hero-title em {
            font-style: italic;
            color: var(--cyan);
            font-family: var(--font-display);
          }
          .hero-lede { max-width: 36rem; color: var(--ink-soft); font-size: var(--step-0); line-height: 1.65; }
          .hero-actions { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; }
          .hero-proof {
            display: flex;
            flex-wrap: wrap;
            gap: .8rem 1.6rem;
            padding-top: var(--s-4);
            border-top: 1px solid var(--rule);
            font-size: var(--step--2);
            color: var(--ink-mute);
          }
          .hero-proof-item { display: inline-flex; align-items: center; gap: .45rem; }
          .hero-proof-item strong { color: var(--ink); font-weight: 600; }
          .hero-art { min-width: 0; }
          .hero-art-frame {
            border-radius: var(--radius-lg);
            background: rgba(11, 19, 41, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 30px -5px rgba(37, 99, 235, 0.2);
            padding: 1.25rem;
            backdrop-filter: blur(12px);
          }
          .hero-ticker {
            position: relative;
            z-index: 1;
            margin-top: clamp(2.5rem, 5vw, 4.5rem);
            overflow: hidden;
            padding: 0.85rem 0;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(0, 0, 0, 0.4);
            white-space: nowrap;
          }
          .hero-ticker-track {
            display: inline-flex;
            gap: 2rem;
            animation: tickerMarquee 35s linear infinite;
            font-family: var(--font-mono);
            font-size: var(--step--2);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--ink-mute);
          }
          .ticker-sep { color: var(--cyan); }

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
              <p className="eyebrow" style={{ color: "var(--cyan)" }}>Operational Blueprint</p>
              <h2 style={{ marginTop: ".6rem" }}>
                Four steps. Zero enquiry drop-off.
              </h2>
            </div>
            <p className="muted small" style={{ maxWidth: "30ch" }}>
              The autonomous sequence we deploy for clients. It works around the clock,
              captures revenue, and keeps an audit trail in your database.
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
            background: rgba(255, 255, 255, 0.02);
            border-radius: var(--radius-lg);
            overflow: hidden;
          }
          .step {
            padding: var(--s-5);
            border-right: 1px solid var(--rule);
            display: grid;
            gap: .65rem;
            align-content: start;
            transition: background var(--dur) var(--ease);
          }
          .step:hover { background: rgba(37, 99, 235, 0.06); }
          .step:last-child { border-right: 0; }
          .step-n { color: var(--cyan); font-size: var(--step--1); font-weight: 700; }
          .step-title { font-family: var(--font-display); font-size: var(--step-2); color: var(--ink); }
          .step-body { font-size: var(--step--1); color: var(--ink-soft); line-height: 1.6; }
          .step-source { font-size: var(--step--2); color: var(--ink-faint); text-transform: uppercase; letter-spacing: .08em; padding-top: .4rem; }

          @media (max-width: 900px) {
            .steps { grid-template-columns: 1fr 1fr; }
            .step:nth-child(2) { border-right: 0; }
            .step:nth-child(1), .step:nth-child(2) { border-bottom: 1px solid var(--rule); }
          }
          @media (max-width: 560px) {
            .steps { grid-template-columns: 1fr; }
            .step { border-right: 0 !important; border-bottom: 1px solid var(--rule); }
            .step:last-child { border-bottom: 0; }
          }
        `}</style>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section className="section" id="services">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow" style={{ color: "var(--cyan)" }}>Enterprise Offerings</p>
              <h2 style={{ marginTop: ".6rem" }}>Six high-impact services built for explosive scale.</h2>
            </div>
            <Link href="/services" className="text-link small" data-cta="home-all-services">
              Compare all services <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="svc-grid">
            {services.map((s) => (
              <Reveal key={s.href}>
                <Link href={s.href} className="svc shine-sweep" data-cta={`home-service-${s.href}`}>
                  <div className="svc-header">
                    <span className="svc-badge">{s.badge}</span>
                    <span className="svc-note mono">{s.note}</span>
                  </div>
                  <h3 className="svc-title">{s.label}</h3>
                  <p className="svc-tagline">{s.tagline}</p>
                  <p className="svc-body">{s.body}</p>
                  <div className="svc-footer">
                    <span className="svc-learn">Explore architecture</span>
                    <span className="svc-arrow" aria-hidden="true">→</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        <style>{`
          .svc-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1.25rem;
          }
          .svc {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: .8rem;
            padding: clamp(1.5rem, 3vw, 2.25rem);
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(11, 19, 41, 0.5));
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-lg);
            text-decoration: none;
            min-height: 20rem;
            transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
          }
          .svc:hover {
            transform: translateY(-4px);
            border-color: rgba(0, 245, 212, 0.4);
            box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.8), 0 0 25px -4px rgba(0, 245, 212, 0.25);
          }
          .svc-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: .4rem;
          }
          .svc-badge {
            font-family: var(--font-mono);
            font-size: var(--step--2);
            text-transform: uppercase;
            letter-spacing: .08em;
            padding: 0.25rem 0.6rem;
            border-radius: 999px;
            background: rgba(0, 245, 212, 0.1);
            color: var(--cyan);
            border: 1px solid rgba(0, 245, 212, 0.2);
          }
          .svc-note {
            color: var(--ink-mute);
            font-size: var(--step--2);
            font-weight: 500;
          }
          .svc-title {
            font-family: var(--font-display);
            font-size: var(--step-2);
            color: var(--ink);
            line-height: 1.15;
          }
          .svc-tagline {
            color: var(--cyan);
            font-size: var(--step--1);
            font-weight: 500;
            line-height: 1.4;
          }
          .svc-body {
            color: var(--ink-soft);
            font-size: var(--step--1);
            line-height: 1.55;
          }
          .svc-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: auto;
            padding-top: 1.25rem;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }
          .svc-learn {
            font-size: var(--step--2);
            font-family: var(--font-mono);
            text-transform: uppercase;
            letter-spacing: .08em;
            color: var(--ink-mute);
            transition: color var(--dur) var(--ease);
          }
          .svc:hover .svc-learn { color: var(--ink); }
          .svc-arrow {
            color: var(--cyan);
            transform: translateX(-4px);
            transition: transform var(--dur) var(--ease);
          }
          .svc:hover .svc-arrow {
            transform: translateX(2px);
          }
          @media (max-width: 1080px) {
            .svc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 680px) {
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

      {/* ── FAQ & Market Search Authority ─────────────────────── */}
      <section className="section section--raised" id="faq">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow" style={{ color: "var(--cyan)" }}>Answers & Clarity</p>
              <h2 style={{ marginTop: ".6rem" }}>Frequently asked engineering questions.</h2>
            </div>
            <Link href="/answers" className="text-link small" data-cta="home-all-faq">
              Knowledge base <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="faq-grid">
            <div className="faq-item">
              <h3 className="faq-q">What makes GrowinTek's web stack faster than typical WordPress or Webflow sites?</h3>
              <p className="faq-a">
                We engineer on Next.js 15, React 19, and edge Vercel/Cloudflare networks with strict image optimization, minimal JavaScript payloads, and zero bloated plugins. Your site loads in under 300ms, ranks higher on Core Web Vitals, and converts mobile traffic instantly.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-q">How do your Autonomous AI Agents integrate with our sales workflow?</h3>
              <p className="faq-a">
                Agents connect directly to your website, WhatsApp, and CRM (HubSpot, Salesforce, or PostgreSQL). They learn your product specs, ask qualifying budget and timeline questions, handle objections 24/7, and book meetings directly into your sales calendar.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-q">What is AEO (Answer Engine Optimization) and why is it replacing traditional SEO?</h3>
              <p className="faq-a">
                Search is shifting to conversational AI like ChatGPT Search, Perplexity, and Google AI Overviews. We architect your site with semantic schema, structured knowledge graphs, and authoritative citation nodes so AI engines recommend your business as the definitive source.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-q">How long does an enterprise deployment typically take?</h3>
              <p className="faq-a">
                Core websites and custom AI qualifier agents launch in 2 to 4 weeks. Full revenue automation pipelines and enterprise custom portals take 4 to 8 weeks with weekly staging demos and guaranteed fixed-price milestone delivery.
              </p>
            </div>
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What makes GrowinTek's web stack faster than typical WordPress or Webflow sites?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "We engineer on Next.js 15, React 19, and edge Vercel/Cloudflare networks with strict image optimization, minimal JavaScript payloads, and zero bloated plugins for sub-300ms load times.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do your Autonomous AI Agents integrate with our sales workflow?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Agents connect directly to your website, WhatsApp, and CRM to qualify budgets, answer questions 24/7, and book calls directly into calendars.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is AEO (Answer Engine Optimization) and why is it replacing traditional SEO?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "AEO structures your site with semantic schema, entity graphs, and technical clarity so AI engines like ChatGPT Search and Perplexity cite and recommend your brand.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How long does an enterprise deployment typically take?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Core websites and AI qualifier agents launch in 2 to 4 weeks with weekly staging demos and guaranteed fixed pricing.",
                  },
                },
              ],
            }),
          }}
        />

        <style>{`
          .faq-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1.5rem;
          }
          .faq-item {
            padding: 1.75rem;
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(11, 19, 41, 0.3));
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-lg);
            display: grid;
            gap: 0.75rem;
            align-content: start;
          }
          .faq-q {
            font-size: var(--step-1);
            color: var(--ink);
            font-weight: 600;
            line-height: 1.35;
          }
          .faq-a {
            font-size: var(--step--1);
            color: var(--ink-soft);
            line-height: 1.65;
          }
          @media (max-width: 768px) {
            .faq-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </section>

      {/* ── Close ────────────────────────────────────────────── */}
      <section className="section section--ink close">
        <div className="wrap close-grid">
          <div>
            <p className="eyebrow" style={{ color: "var(--cyan)" }}>Ready to Accelerate</p>
            <h2 className="display close-title">
              Let's build your
              <br />
              <span className="text-gradient">growth engine.</span>
            </h2>
            <p className="lede close-lede">
              Twenty minutes, no pitch decks. We analyze where your leads currently leak,
              audit your conversion latency, and outline an exact engineering blueprint to 3x your inbound pipeline.
            </p>
            <div className="close-actions">
              <Link href="/contact" className="btn btn--shine shine-sweep" data-cta="home-close-book">
                Book a 20-minute intro call
              </Link>
              <a href={mailto()} className="btn btn--ghost close-mail" data-cta="home-close-email">
                Email hello@growintek.com
              </a>
            </div>
          </div>
          <div className="close-facts">
            <div>
              <span className="mono">01</span>
              <p>Direct communication with lead engineers. No middlemen, no account executive fluff.</p>
            </div>
            <div>
              <span className="mono">02</span>
              <p>Fixed milestones & guaranteed transparency. You sign off before final delivery.</p>
            </div>
            <div>
              <span className="mono">03</span>
              <p>Ship in 2 to 6 weeks. Live staging links updated every single week.</p>
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
          .close-title { font-size: clamp(2.4rem, 4.5vw, 4.2rem); color: var(--ink); line-height: 1.05; }
          .close-lede { color: var(--ink-soft); margin-top: var(--s-4); }
          .close-actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: var(--s-5); }
          .close-facts { display: grid; gap: var(--s-5); padding-top: var(--s-4); }
          .close-facts > div { display: grid; grid-template-columns: 3rem 1fr; gap: var(--s-3); border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: var(--s-4); }
          .close-facts .mono { color: var(--cyan); font-size: var(--step--1); font-weight: 700; }
          .close-facts p { font-size: var(--step--1); color: var(--ink-soft); line-height: 1.6; }
          @media (max-width: 860px) { .close-grid { grid-template-columns: 1fr; gap: var(--s-6); } }
        `}</style>
      </section>
    </>
  );
}
