export default function PageHero({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
  aside?: React.ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="wrap page-hero-grid">
        <div className="page-hero-copy">
          <p className="eyebrow eyebrow--cobalt">{eyebrow}</p>
          <h1 className="display page-hero-title">{title}</h1>
          {lede && <p className="lede">{lede}</p>}
        </div>
        {aside && <div className="page-hero-aside">{aside}</div>}
      </div>

      <style>{`
        .page-hero {
          padding-block: clamp(2.5rem, 6vw, 5rem) clamp(2rem, 4vw, 3.5rem);
          border-bottom: 1px solid var(--rule);
          background:
            radial-gradient(48rem 24rem at 92% 0%, rgba(27, 44, 224, .055), transparent 65%);
        }
        .page-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: var(--s-7);
          align-items: end;
        }
        .page-hero-copy { display: grid; gap: var(--s-4); }
        .page-hero-title {
          font-size: var(--step-5);
          letter-spacing: -.035em;
        }
        .page-hero-aside { max-width: 19rem; }
        .hero-aside {
          display: grid;
          gap: .6rem;
          padding: var(--s-4);
          border: 1px solid var(--rule);
          border-radius: var(--radius-lg);
          background: var(--paper-raised);
        }
        .hero-aside .btn { justify-self: start; }

        @media (max-width: 860px) {
          .page-hero-grid { grid-template-columns: 1fr; gap: var(--s-5); }
          .page-hero-aside { max-width: 100%; }
        }
      `}</style>
    </section>
  );
}
