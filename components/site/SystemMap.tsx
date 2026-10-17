"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The signature element: a schematic of a lead moving through a business.
 * Drawn as a single flat diagram — not floating cards — because the claim
 * being made is about sequence, not features.
 */
export default function SystemMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setLive(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLive(true);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`map ${live ? "map--live" : ""}`} ref={ref}>
      <div className="map-head">
        <span className="mono map-label">Lead journey · live schematic</span>
        <span className="map-state">
          <span className="dot" aria-hidden="true" />
          running
        </span>
      </div>

      <svg
        viewBox="0 0 520 430"
        className="map-svg"
        role="img"
        aria-label="Diagram: an enquiry arrives on the website, is answered by an AI agent, written to the CRM, followed up automatically, and escalated to a human when it matters."
      >
        <defs>
          <marker id="map-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0.6 7 4 0 7.4Z" fill="currentColor" />
          </marker>
          <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0v20" fill="none" stroke="#14150f" strokeOpacity="0.05" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="520" height="430" fill="url(#map-grid)" />

        {/* spine */}
        <path
          d="M104 92 H164 M236 92 H288 M360 92 H410 V186 H452"
          className="map-wire"
          markerEnd="url(#map-arrow)"
        />
        <path
          d="M452 214 V268 M452 300 V332 H108 V214 M108 186 V118"
          className="map-wire"
        />
        <path d="M136 150 V214" className="map-wire map-wire--soft" />
        <path d="M252 150 V214" className="map-wire map-wire--soft" />
        <path d="M368 150 V214" className="map-wire map-wire--soft" />

        {/* travelling pulse along the spine */}
        <path
          d="M104 92 H164 M236 92 H288 M360 92 H410 V186 H452 V268 V300 V332 H108 V214 M108 186 V118"
          className="map-pulse"
        />

        {/* ── nodes ── */}
        <g className="map-node">
          <rect x="24" y="62" width="80" height="60" rx="3" />
          <text x="64" y="86" className="map-node-title" textAnchor="middle">Enquiry</text>
          <text x="64" y="103" className="map-node-sub" textAnchor="middle">form · call · DM</text>
        </g>

        <g className="map-node map-node--accent">
          <rect x="164" y="62" width="72" height="60" rx="3" />
          <text x="200" y="86" className="map-node-title" textAnchor="middle">Agent</text>
          <text x="200" y="103" className="map-node-sub" textAnchor="middle">replies 24/7</text>
        </g>

        <g className="map-node">
          <rect x="288" y="62" width="72" height="60" rx="3" />
          <text x="324" y="86" className="map-node-title" textAnchor="middle">CRM</text>
          <text x="324" y="103" className="map-node-sub" textAnchor="middle">qualified</text>
        </g>

        <g className="map-node">
          <rect x="410" y="92" width="86" height="56" rx="3" />
          <text x="453" y="115" className="map-node-title" textAnchor="middle">Brief</text>
          <text x="453" y="131" className="map-node-sub" textAnchor="middle">in your inbox</text>
        </g>

        <g className="map-node">
          <rect x="410" y="268" width="86" height="64" rx="3" />
          <text x="453" y="291" className="map-node-title" textAnchor="middle">Follow-up</text>
          <text x="453" y="307" className="map-node-sub" textAnchor="middle">day 2 · day 7</text>
          <text x="453" y="321" className="map-node-sub" textAnchor="middle">auto</text>
        </g>

        <g className="map-node map-node--human">
          <rect x="60" y="268" width="88" height="64" rx="3" />
          <text x="104" y="291" className="map-node-title" textAnchor="middle">You</text>
          <text x="104" y="307" className="map-node-sub" textAnchor="middle">one clear</text>
          <text x="104" y="321" className="map-node-sub" textAnchor="middle">task</text>
        </g>

        {/* measurement rail */}
        <g className="map-rail">
          <rect x="136" y="214" width="90" height="40" rx="3" />
          <text x="181" y="232" className="map-node-sub" textAnchor="middle">response time</text>
          <text x="181" y="246" className="map-node-title map-node-title--sm" textAnchor="middle">34 sec</text>
        </g>
        <g className="map-rail">
          <rect x="252" y="214" width="82" height="40" rx="3" />
          <text x="293" y="232" className="map-node-sub" textAnchor="middle">qualified</text>
          <text x="293" y="246" className="map-node-title map-node-title--sm" textAnchor="middle">1 brief</text>
        </g>
        <g className="map-rail">
          <rect x="352" y="214" width="90" height="40" rx="3" />
          <text x="397" y="232" className="map-node-sub" textAnchor="middle">hours saved</text>
          <text x="397" y="246" className="map-node-title map-node-title--sm" textAnchor="middle">~14 / wk</text>
        </g>

        {/* escalation */}
        <path d="M410 300 H148" className="map-wire map-wire--soft" strokeDasharray="3 4" />
        <text x="280" y="352" className="map-caption" textAnchor="middle">
          escalates only when it matters
        </text>

        {/* legend */}
        <g>
          <rect x="24" y="384" width="220" height="30" rx="3" className="map-legend" />
          <circle cx="38" cy="399" r="3" className="map-legend-dot" />
          <text x="48" y="403" className="map-caption">your stack, connected</text>
          <rect x="276" y="384" width="220" height="30" rx="3" className="map-legend" />
          <circle cx="290" cy="399" r="3" className="map-legend-dot map-legend-dot--accent" />
          <text x="300" y="403" className="map-caption">built and maintained by us</text>
        </g>
      </svg>

      <div className="map-foot">
        <p className="tiny">
          Illustrative schematic. Your map is drawn during the intro call and
          becomes the build plan.
        </p>
        <span className="mono tiny map-stamp">GT / 01</span>
      </div>

      <style>{`
        .map {
          background: var(--paper-raised);
          border: 1px solid var(--rule);
          border-radius: var(--radius-lg);
          padding: var(--s-4);
          box-shadow: var(--shadow-lift);
          display: grid;
          gap: .75rem;
        }
        .map-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding-bottom: .6rem;
          border-bottom: 1px solid var(--rule);
        }
        .map-label { font-size: var(--step--2); text-transform: uppercase; letter-spacing: .1em; color: var(--ink-mute); }
        .map-state { display: inline-flex; align-items: center; gap: .35rem; font-family: var(--font-mono); font-size: var(--step--2); color: #4d7a3a; text-transform: uppercase; letter-spacing: .08em; }
        .map-state .dot { background: #4d7a3a; box-shadow: 0 0 0 3px rgba(77,122,58,.15); }

        .map-svg { width: 100%; height: auto; color: var(--ink); overflow: visible; }

        .map-wire { fill: none; stroke: var(--rule-strong); stroke-width: 1.4; color: var(--rule-strong); }
        .map-wire--soft { stroke-dasharray: 2 5; stroke: var(--rule-strong); }

        .map-pulse {
          fill: none;
          stroke: var(--cobalt);
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-dasharray: 26 1200;
          stroke-dashoffset: 1226;
          opacity: 0;
        }
        .map--live .map-pulse {
          opacity: 1;
          animation: pulse-travel 7s cubic-bezier(.45,.05,.35,.95) infinite;
        }
        @keyframes pulse-travel {
          0% { stroke-dashoffset: 1226; }
          70%, 100% { stroke-dashoffset: 0; }
        }

        .map-node rect { fill: var(--paper); stroke: var(--rule-strong); stroke-width: 1.2; }
        .map-node--accent rect { fill: var(--cobalt-wash); stroke: var(--cobalt); }
        .map-node--human rect { fill: var(--sage-wash); stroke: #8ba07c; }

        .map-node-title { font-family: var(--font-body); font-size: 12.5px; font-weight: 650; fill: var(--ink); letter-spacing: -.01em; }
        .map-node-title--sm { font-family: var(--font-mono); font-size: 11px; font-weight: 500; }
        .map-node-sub { font-family: var(--font-mono); font-size: 8.6px; fill: var(--ink-mute); letter-spacing: .04em; }

        .map-rail rect { fill: none; stroke: var(--rule); stroke-width: 1; stroke-dasharray: 3 3; }

        .map-caption { font-family: var(--font-mono); font-size: 8.6px; fill: var(--ink-faint); letter-spacing: .06em; }
        .map-legend { fill: none; stroke: var(--rule); stroke-width: 1; }
        .map-legend-dot { fill: var(--ink-mute); }
        .map-legend-dot--accent { fill: var(--cobalt); }

        .map-foot {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          padding-top: .6rem;
          border-top: 1px solid var(--rule);
          color: var(--ink-mute);
        }
        .map-stamp { color: var(--ink-faint); white-space: nowrap; }

        @media (max-width: 520px) {
          .map { padding: var(--s-3); }
          .map-foot p { font-size: .68rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .map--live .map-pulse { animation: none; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
