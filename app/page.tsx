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
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="hero-badge-wrap">
              <span className="hero-badge">
                <span className="dot dot--pulse" aria-hidden="true" />
                Engineering High-Growth Web & Autonomous AI
              </span>
            </div>

            <h1 className="display hero-title">
              Web applications &
              <br />
              <span className="text-highlight">AI agents</span> built to
              <br />
              <em>scale your revenue.</em>
            </h1>

            <p className="lede hero-lede">
              Most businesses lose high-value enquiries between the contact form and the first reply.
              GrowinTek engineers sub-second Next.js web applications, autonomous 24/7 qualifying AI agents,
              and automated revenue pipelines so no lead goes cold.
            </p>

            <div className="hero-actions">
              <Link href="/contact" className="btn btn--primary" data-cta="hero-book">
                Book a 20-minute intro call
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
                  <span className="dot" style={{ background: "var(--emerald)" }} />
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
            padding-top: clamp(3.5rem, 7vw, 6rem);
            padding-bottom: clamp(2.5rem, 5vw, 4rem);
            border-bottom: 1px solid var(--rule);
            background:
              radial-gradient(ellipse 70% 45% at 50% 0%, rgba(37, 99, 235, 0.14), transparent 70%),
              var(--paper);
          }
          .hero-grid {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.95fr);
            gap: clamp(2.5rem, 5vw, 4.5rem);
            align-items: center;
          }
          .hero-copy { display: grid; gap: var(--s-5); align-content: center; }
          .hero-badge-wrap { display: flex; align-items: center; }
          .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.35rem 0.85rem;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--rule-strong);
            border-radius: 999px;
            font-size: var(--step--2);
            font-family: var(--font-mono);
            color: var(--ink-soft);
            letter-spacing: 0.03em;
            text-transform: uppercase;
          }
          .dot--pulse {
            background: var(--emerald);
            box-shadow: 0 0 8px var(--emerald);
          }
          .hero-title {
            font-size: clamp(2.4rem, 4.2vw, 4.2rem);
            line-height: 1.05;
            letter-spacing: -.03em;
            font-weight: 600;
            color: var(--ink);
          }
          .text-highlight {
            color: #60a5fa;
          }
          .hero-title em {
            font-style: italic;
            color: var(--emerald);
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
            background: var(--paper-raised);
            border: 1px solid var(--rule);
            box-shadow: var(--shadow-lift);
            padding: 1.25rem;
          }
          .hero-ticker {
            position: relative;
            z-index: 1;
            margin-top: clamp(2.5rem, 5vw, 4rem);
            overflow: hidden;
            padding: 0.85rem 0;
            border-top: 1px solid var(--rule);
            border-bottom: 1px solid var(--rule);
            background: var(--paper-sunk);
            white-space: nowrap;
          }
          .hero-ticker-track {
            display: inline-flex;
            gap: 2rem;
            animation: tickerMarquee 40s linear infinite;
            font-family: var(--font-mono);
            font-size: var(--step--2);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--ink-mute);
          }
          .ticker-sep { color: var(--accent); }

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

      {/* ── Zigzag Strategic Blueprint ───────────────────────── */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow" style={{ color: "var(--accent)" }}>Strategic Framework</p>
              <h2 style={{ marginTop: ".6rem" }}>
                How GrowinTek scales your operational throughput.
              </h2>
            </div>
            <p className="muted small" style={{ maxWidth: "34ch" }}>
              Our proven sequence combines ultra-fast frontend infrastructure with autonomous AI intelligence.
            </p>
          </div>

          <div className="zigzag-list">
            {/* Row 1: Fast Conversion Engine */}
            <div className="zigzag-row">
              <div className="zigzag-content">
                <span className="mono tiny" style={{ color: "var(--accent)" }}>01 · CONVERSION SPEED</span>
                <h3 style={{ fontSize: "var(--step-3)", color: "var(--ink)", lineHeight: 1.15 }}>
                  Sub-second web architecture that eliminates bounce rates.
                </h3>
                <p className="muted" style={{ lineHeight: 1.65 }}>
                  Standard agency websites suffer from 3-5 second load times, bloated WordPress plugins, and leaky forms. We engineer on Next.js 15, React 19, and edge Vercel networks to deliver instant sub-300ms interactions that maximize user trust and paid traffic ROI.
                </p>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: ".5rem" }}>
                  <div>
                    <span className="mono" style={{ fontSize: "var(--step-2)", color: "var(--emerald)", fontWeight: 700 }}>99+</span>
                    <p className="tiny muted">Core Web Vitals</p>
                  </div>
                  <div>
                    <span className="mono" style={{ fontSize: "var(--step-2)", color: "var(--accent)", fontWeight: 700 }}>&lt;300ms</span>
                    <p className="tiny muted">Edge TTFB</p>
                  </div>
                </div>
              </div>
              <div className="zigzag-visual">
                <div style={{ padding: "1.5rem", background: "var(--paper-sunk)", borderRadius: "var(--radius)", border: "1px solid var(--rule)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <span className="mono tiny muted">PERFORMANCE BENCHMARK</span>
                    <span className="mono tiny" style={{ color: "var(--emerald)" }}>PASSED</span>
                  </div>
                  <div style={{ display: "grid", gap: ".75rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: ".75rem", borderRadius: "6px" }}>
                      <p className="tiny muted">First Contentful Paint</p>
                      <p className="mono" style={{ fontWeight: 600 }}>0.4s · Instantaneous</p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: ".75rem", borderRadius: "6px" }}>
                      <p className="tiny muted">Cumulative Layout Shift</p>
                      <p className="mono" style={{ fontWeight: 600 }}>0.000 · Zero Jitter</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: 24/7 AI Reception (Reversed) */}
            <div className="zigzag-row zigzag-row--reverse">
              <div className="zigzag-content">
                <span className="mono tiny" style={{ color: "var(--emerald)" }}>02 · AUTONOMOUS ENGAGEMENT</span>
                <h3 style={{ fontSize: "var(--step-3)", color: "var(--ink)", lineHeight: 1.15 }}>
                  AI Agents that qualify leads while your team sleeps.
                </h3>
                <p className="muted" style={{ lineHeight: 1.65 }}>
                  The moment an enquiry lands, our autonomous AI agent engages in under 30 seconds. It clarifies requirements, asks crucial budget and timeline qualification questions, and schedules calendar appointments directly with your closers.
                </p>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: ".5rem" }}>
                  <div>
                    <span className="mono" style={{ fontSize: "var(--step-2)", color: "var(--accent)", fontWeight: 700 }}>24/7</span>
                    <p className="tiny muted">Active Coverage</p>
                  </div>
                  <div>
                    <span className="mono" style={{ fontSize: "var(--step-2)", color: "var(--emerald)", fontWeight: 700 }}>30 sec</span>
                    <p className="tiny muted">Average First Reply</p>
                  </div>
                </div>
              </div>
              <div className="zigzag-visual">
                <div style={{ padding: "1.5rem", background: "var(--paper-sunk)", borderRadius: "var(--radius)", border: "1px solid var(--rule)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem" }}>
                    <span className="dot" style={{ background: "var(--emerald)" }} />
                    <span className="mono tiny">Autonomous Qualifier · Live Transcript</span>
                  </div>
                  <div style={{ display: "grid", gap: ".6rem", fontSize: "var(--step--2)" }}>
                    <div style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)", padding: ".6rem .8rem", borderRadius: "6px", color: "var(--ink)" }}>
                      <strong>AI Agent:</strong> "Hi Sarah! Thanks for reaching out. What timeframe are you targeting for your platform re-architecture?"
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: ".6rem .8rem", borderRadius: "6px", color: "var(--ink-soft)" }}>
                      <strong>Lead:</strong> "We need to launch by Q2, budget allocated is $35k."
                    </div>
                    <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", padding: ".6rem .8rem", borderRadius: "6px", color: "var(--emerald)" }}>
                      ✓ Qualified → Calendar invite dispatched to Sales Director.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Automated Revenue Pipelines */}
            <div className="zigzag-row">
              <div className="zigzag-content">
                <span className="mono tiny" style={{ color: "var(--accent)" }}>03 · DATA & REVENUE SYNC</span>
                <h3 style={{ fontSize: "var(--step-3)", color: "var(--ink)", lineHeight: 1.15 }}>
                  Zero-touch database syncing with your existing CRM.
                </h3>
                <p className="muted" style={{ lineHeight: 1.65 }}>
                  Every conversation, quote, and interaction writes automatically to your PostgreSQL database, HubSpot, or Slack. No duplicate manual entry, no forgotten leads, and total visibility across your pipeline.
                </p>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: ".5rem" }}>
                  <div>
                    <span className="mono" style={{ fontSize: "var(--step-2)", color: "var(--emerald)", fontWeight: 700 }}>100%</span>
                    <p className="tiny muted">Audit Compliance</p>
                  </div>
                  <div>
                    <span className="mono" style={{ fontSize: "var(--step-2)", color: "var(--accent)", fontWeight: 700 }}>0 hrs</span>
                    <p className="tiny muted">Manual Data Entry</p>
                  </div>
                </div>
              </div>
              <div className="zigzag-visual">
                <div style={{ padding: "1.5rem", background: "var(--paper-sunk)", borderRadius: "var(--radius)", border: "1px solid var(--rule)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <span className="mono tiny muted">INTEGRATION TELEMETRY</span>
                    <span className="mono tiny" style={{ color: "var(--accent)" }}>REALTIME</span>
                  </div>
                  <div style={{ display: "grid", gap: ".5rem", fontFamily: "var(--font-mono)", fontSize: "var(--step--2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: ".5rem 0", borderBottom: "1px solid var(--rule)" }}>
                      <span>PostgreSQL Database</span>
                      <span style={{ color: "var(--emerald)" }}>Synced</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: ".5rem 0", borderBottom: "1px solid var(--rule)" }}>
                      <span>Stripe Billing Engine</span>
                      <span style={{ color: "var(--emerald)" }}>Connected</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: ".5rem 0" }}>
                      <span>Slack Alert Webhook</span>
                      <span style={{ color: "var(--emerald)" }}>Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section className="section section--raised" id="services">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow" style={{ color: "var(--accent)" }}>Enterprise Capabilities</p>
              <h2 style={{ marginTop: ".6rem" }}>Six specialized practices engineered for market leaders.</h2>
            </div>
            <Link href="/services" className="text-link small" data-cta="home-all-services">
              Compare all services <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="svc-grid">
            {services.map((s) => (
              <Reveal key={s.href}>
                <Link href={s.href} className="svc" data-cta={`home-service-${s.href}`}>
                  <div className="svc-header">
                    <span className="svc-badge">{s.badge}</span>
                    <span className="svc-note mono">{s.note}</span>
                  </div>
                  <h3 className="svc-title">{s.label}</h3>
                  <p className="svc-tagline">{s.tagline}</p>
                  <p className="svc-body">{s.body}</p>
                  <div className="svc-footer">
                    <span className="svc-learn">View specifications</span>
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
            padding: clamp(1.5rem, 3vw, 2rem);
            background: var(--paper);
            border: 1px solid var(--rule);
            border-radius: var(--radius-lg);
            text-decoration: none;
            min-height: 19rem;
            transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
          }
          .svc:hover {
            transform: translateY(-3px);
            border-color: var(--rule-strong);
            box-shadow: var(--shadow-lift);
          }
          .svc-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: .25rem;
          }
          .svc-badge {
            font-family: var(--font-mono);
            font-size: var(--step--2);
            text-transform: uppercase;
            letter-spacing: .06em;
            padding: 0.25rem 0.6rem;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.04);
            color: var(--ink-soft);
            border: 1px solid var(--rule);
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
            line-height: 1.2;
          }
          .svc-tagline {
            color: var(--accent);
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
            border-top: 1px solid var(--rule);
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
            color: var(--accent);
            transform: translateX(-3px);
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
            background: var(--paper-raised);
            border: 1px solid var(--rule);
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
            <p className="eyebrow" style={{ color: "var(--accent)" }}>Ready to Accelerate</p>
            <h2 className="display close-title">
              Let's build your
              <br />
              <span className="text-highlight">growth engine.</span>
            </h2>
            <p className="lede close-lede">
              Twenty minutes, no pitch decks. We analyze where your enquiries currently leak,
              audit your conversion latency, and outline an exact engineering blueprint to 3x your inbound pipeline.
            </p>
            <div className="close-actions">
              <Link href="/contact" className="btn btn--primary" data-cta="home-close-book">
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
          .close-facts > div { display: grid; grid-template-columns: 3rem 1fr; gap: var(--s-3); border-top: 1px solid var(--rule); padding-top: var(--s-4); }
          .close-facts .mono { color: var(--emerald); font-size: var(--step--1); font-weight: 700; }
          .close-facts p { font-size: var(--step--1); color: var(--ink-soft); line-height: 1.6; }
          @media (max-width: 860px) { .close-grid { grid-template-columns: 1fr; gap: var(--s-6); } }
        `}</style>
      </section>
    </>
  );
}
