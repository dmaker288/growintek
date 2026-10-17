import Link from "next/link";

export default function NotFound() {
  return (
    <section className="nf">
      <div className="wrap">
        <p className="mono nf-code">404</p>
        <h1 className="display nf-title">
          This page took
          <br />
          <em>a different route.</em>
        </h1>
        <p className="lede">
          The link is broken, the page moved, or it never existed. The useful
          places are below.
        </p>
        <div className="nf-links">
          <Link href="/" className="btn btn--cobalt">Home</Link>
          <Link href="/services" className="btn btn--ghost">Services</Link>
          <Link href="/pricing" className="btn btn--ghost">Pricing</Link>
          <Link href="/contact" className="btn btn--ghost">Contact</Link>
        </div>
      </div>

      <style>{`
        .nf { padding-block: clamp(4rem, 12vw, 9rem); }
        .nf-code {
          font-size: var(--step--1);
          color: var(--cobalt);
          letter-spacing: .2em;
        }
        .nf-title {
          font-size: var(--step-5);
          letter-spacing: -.035em;
          margin: .8rem 0 1.25rem;
        }
        .nf-links { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 2rem; }
      `}</style>
    </section>
  );
}
