/**
 * Dependency-free SVG charts. Server-rendered, so they cost no JS and
 * work before hydration. Every chart includes a screen-reader summary.
 */

export type Point = { label: string; value: number };

// ── Sparkline / area ─────────────────────────────────────────

export function AreaChart({
  series,
  height = 160,
  label,
  colour = "#1b2ce0",
  fill = "rgba(27,44,224,.10)",
}: {
  series: Point[];
  height?: number;
  label: string;
  colour?: string;
  fill?: string;
}) {
  const W = 600;
  const H = height;
  const pad = { t: 10, r: 6, b: 18, l: 6 };
  const max = Math.max(1, ...series.map((p) => p.value));
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const step = series.length > 1 ? innerW / (series.length - 1) : 0;

  const pts = series.map((p, i) => {
    const x = pad.l + i * step;
    const y = pad.t + innerH - (p.value / max) * innerH;
    return [x, y] as const;
  });

  const line = smoothPath(pts);
  const area = `${line} L ${pad.l + innerW} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`;

  const every = Math.max(1, Math.ceil(series.length / 7));

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}: ${series.map((p) => `${p.label} ${p.value}`).join(", ")}`}
        className="chart-svg"
        style={{ height }}
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={pad.l}
            x2={W - pad.r}
            y1={pad.t + innerH * (1 - f)}
            y2={pad.t + innerH * (1 - f)}
            stroke="#e8e2d4"
            strokeWidth="1"
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={area} fill={fill} />
        <path
          d={line}
          fill="none"
          stroke={colour}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {pts.length > 0 && (
          <circle
            cx={pts[pts.length - 1][0]}
            cy={pts[pts.length - 1][1]}
            r="3"
            fill={colour}
          />
        )}
      </svg>
      <figcaption className="chart-x">
        {series.map((p, i) =>
          i % every === 0 || i === series.length - 1 ? (
            <span key={p.label}>{p.label}</span>
          ) : null
        )}
      </figcaption>
      <style>{`
        .chart { display: grid; gap: .35rem; margin: 0; }
        .chart-svg { width: 100%; display: block; }
        .chart-x {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: .58rem;
          color: #9a9684;
          letter-spacing: .04em;
        }
      `}</style>
    </figure>
  );
}

function smoothPath(pts: readonly (readonly [number, number])[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

// ── Multi-series line (pageviews + leads) ───────────────────

export function DualChart({
  a,
  b,
  aLabel,
  bLabel,
  height = 200,
}: {
  a: Point[];
  b: Point[];
  aLabel: string;
  bLabel: string;
  height?: number;
}) {
  const W = 600;
  const H = height;
  const pad = { t: 12, r: 8, b: 20, l: 8 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(1, ...a.map((p) => p.value), ...b.map((p) => p.value));
  const len = Math.max(a.length, b.length);
  const step = len > 1 ? innerW / (len - 1) : 0;

  const toPts = (s: Point[]) =>
    s.map((p, i) => [
      pad.l + i * step,
      pad.t + innerH - (p.value / max) * innerH,
    ] as const);

  const pa = toPts(a);
  const pb = toPts(b);
  const every = Math.max(1, Math.ceil(len / 7));

  return (
    <figure className="dual">
      <div className="dual-legend">
        <span><i style={{ background: "#1b2ce0" }} />{aLabel}</span>
        <span><i style={{ background: "#a7b79a" }} />{bLabel}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${aLabel} versus ${bLabel} over ${len} days`}
        style={{ height }}
        className="dual-svg"
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={pad.l}
            x2={W - pad.r}
            y1={pad.t + innerH * (1 - f)}
            y2={pad.t + innerH * (1 - f)}
            stroke="#e8e2d4"
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={smoothPath(pb)} fill="none" stroke="#a7b79a" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        <path d={smoothPath(pa)} fill="none" stroke="#1b2ce0" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>
      <figcaption className="dual-x">
        {a.map((p, i) => (i % every === 0 || i === a.length - 1 ? <span key={p.label}>{p.label}</span> : null))}
      </figcaption>
      <style>{`
        .dual { display: grid; gap: .4rem; margin: 0; }
        .dual-svg { width: 100%; display: block; }
        .dual-legend { display: flex; gap: 1rem; font-size: .72rem; color: #6d6a5b; }
        .dual-legend span { display: inline-flex; align-items: center; gap: .35rem; }
        .dual-legend i { width: 10px; height: 2px; border-radius: 2px; }
        .dual-x { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: .58rem; color: #9a9684; }
      `}</style>
    </figure>
  );
}

// ── Horizontal bars ─────────────────────────────────────────

export function BarList({
  items,
  emptyLabel = "No data yet",
}: {
  items: { label: string; value: number; hint?: string }[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="dim" style={{ fontSize: ".8rem", margin: 0 }}>{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.value));

  return (
    <ul className="barlist">
      {items.map((i) => (
        <li key={i.label}>
          <span className="barlist-label" title={i.label}>{i.label}</span>
          <span className="barlist-track">
            <span
              className="barlist-fill"
              style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }}
            />
          </span>
          <span className="barlist-value mono-num">{i.value}</span>
        </li>
      ))}
      <style>{`
        .barlist { display: grid; gap: .5rem; }
        .barlist li { display: grid; grid-template-columns: minmax(4rem, 9rem) 1fr 2.2rem; gap: .6rem; align-items: center; font-size: .76rem; }
        .barlist-label { color: #3d3c31; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .barlist-track { height: 6px; background: #efeadd; border-radius: 999px; overflow: hidden; }
        .barlist-fill { display: block; height: 100%; background: #1b2ce0; border-radius: 999px; min-width: 2px; }
        .barlist-value { text-align: right; color: #6d6a5b; font-size: .72rem; }
      `}</style>
    </ul>
  );
}

// ── Donut ───────────────────────────────────────────────────

export function Donut({
  segments,
  label,
  size = 132,
}: {
  segments: { label: string; value: number; colour: string }[];
  label: string;
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut" role="img" aria-label={`${label}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}>
      <svg viewBox="0 0 140 140" width={size} height={size}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#efeadd" strokeWidth="14" />
        {total > 0 &&
          segments.map((s) => {
            const frac = s.value / total;
            const dash = frac * c;
            const el = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.colour}
                strokeWidth="14"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return el;
          })}
      </svg>
      <ul className="donut-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.colour }} />
            <span>{s.label}</span>
            <span className="mono-num dim">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
      <style>{`
        .donut { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .donut-legend { display: grid; gap: .35rem; font-size: .74rem; }
        .donut-legend li { display: grid; grid-template-columns: .5rem 1fr auto; gap: .45rem; align-items: center; }
        .donut-legend i { width: 8px; height: 8px; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ── Columns (revenue by month) ──────────────────────────────

export function Columns({
  items,
  height = 170,
  format = (n: number) => String(n),
}: {
  items: { label: string; value: number }[];
  height?: number;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="cols" style={{ height }}>
      {items.map((i) => (
        <div key={i.label} className="col">
          <span className="col-val mono-num">{i.value > 0 ? format(i.value) : ""}</span>
          <span
            className="col-bar"
            style={{ height: `${Math.max(2, (i.value / max) * 100)}%` }}
            title={`${i.label}: ${format(i.value)}`}
          />
          <span className="col-label">{i.label}</span>
        </div>
      ))}
      <style>{`
        .cols { display: flex; align-items: flex-end; gap: .5rem; padding-top: 1rem; }
        .col { flex: 1; display: grid; grid-template-rows: 1rem 1fr auto; justify-items: center; gap: .25rem; height: 100%; min-width: 0; }
        .col-bar { width: 100%; max-width: 3rem; background: #1b2ce0; border-radius: 3px 3px 0 0; align-self: end; transition: background .15s; }
        .col:hover .col-bar { background: #121da8; }
        .col-val { font-size: .6rem; color: #6d6a5b; white-space: nowrap; }
        .col-label { font-family: var(--font-mono); font-size: .58rem; color: #9a9684; text-transform: uppercase; letter-spacing: .06em; }
      `}</style>
    </div>
  );
}
