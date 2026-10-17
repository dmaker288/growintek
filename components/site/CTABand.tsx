import Link from "next/link";

export default function CTABand({
  title,
  body,
  cta,
  href,
  secondary,
  secondaryHref,
}: {
  title: string;
  body?: string;
  cta: string;
  href: string;
  secondary?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="cta-band">
      <div className="wrap cta-inner">
        <div className="cta-copy">
          <h2 className="display cta-title">{title}</h2>
          {body && <p className="cta-body">{body}</p>}
        </div>
        <div className="cta-actions">
          <Link href={href} className="btn btn--cobalt" data-cta={`cta-${href}`}>
            {cta}
            <svg width="12" height="12" viewBox="0 0 12 12" className="arrow" aria-hidden="true">
              <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </Link>
          {secondary && secondaryHref && (
            <Link href={secondaryHref} className="btn btn--ghost">
              {secondary}
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .cta-band {
          border-top: 1px solid var(--rule);
          padding-block: clamp(2.5rem, 5vw, 4rem);
          background: var(--paper-sunk);
        }
        .cta-inner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--s-5);
        }
        .cta-copy { display: grid; gap: .6rem; max-width: 44rem; }
        .cta-title { font-size: var(--step-4); }
        .cta-body { color: var(--ink-mute); font-size: var(--step-0); max-width: 52ch; }
        .cta-actions { display: flex; flex-wrap: wrap; gap: .6rem; }
        @media (max-width: 620px) {
          .cta-actions { width: 100%; }
          .cta-actions .btn { flex: 1 1 auto; justify-content: center; }
        }
      `}</style>
    </section>
  );
}
