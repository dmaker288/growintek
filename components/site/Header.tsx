import Link from "next/link";
import Image from "next/image";
import { nav, site, mailto } from "@/lib/site";
import MobileMenu from "./MobileMenu";

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="wordmark" aria-label={`${site.name} home`}>
          <Image
            src="/images/logo-wide.webp"
            alt="GrowinTek"
            width={154}
            height={42}
            priority
            className="header-logo-img"
          />
        </Link>

        <nav className="desk-nav" aria-label="Primary">
          {nav.map((item) =>
            item.children ? (
              <div className="nav-group" key={item.href}>
                <Link href={item.href} className="nav-link">
                  {item.label}
                  <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" className="nav-caret">
                    <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
                  </svg>
                </Link>
                <div className="nav-menu" role="group" aria-label={item.label}>
                  {item.children.map((child) => (
                    <Link href={child.href} key={child.href} className="nav-menu-item">
                      <span className="nav-menu-label">{child.label}</span>
                      <span className="nav-menu-desc">{child.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link href={item.href} className="nav-link" key={item.href}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="header-actions">
          <a href={mailto("Enquiry from growintek.com")} className="header-mail">
            {site.email}
          </a>
          <Link href="/contact" className="btn btn--sm header-cta" data-cta="header-book">
            Book a call
            <svg width="12" height="12" viewBox="0 0 12 12" className="arrow" aria-hidden="true">
              <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </Link>
          <MobileMenu nav={nav} />
        </div>
      </div>
      <style>{`
        .skip-link {
          position: absolute;
          left: 1rem;
          top: -3rem;
          background: var(--ink);
          color: var(--paper-raised);
          padding: .6rem 1rem;
          border-radius: var(--radius);
          z-index: 100;
          transition: top .2s;
        }
        .skip-link:focus { top: .75rem; }

        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          height: var(--header-h);
          background: color-mix(in srgb, var(--paper) 88%, transparent);
          backdrop-filter: saturate(140%) blur(10px);
          -webkit-backdrop-filter: saturate(140%) blur(10px);
          border-bottom: 1px solid var(--rule);
        }
        .header-inner {
          height: 100%;
          display: flex;
          align-items: center;
          gap: var(--s-5);
        }
        .wordmark {
          display: inline-flex;
          align-items: center;
          gap: .55rem;
          text-decoration: none;
          flex: none;
        }
        .wordmark-mark { color: var(--cobalt); display: grid; place-items: center; }
        .wordmark-text {
          font-family: var(--font-display);
          font-size: 1.32rem;
          letter-spacing: -.035em;
          font-weight: 500;
        }
        .wordmark-tek { color: var(--cobalt); }

        .desk-nav {
          display: flex;
          align-items: center;
          gap: .15rem;
          margin-left: auto;
        }
        .nav-group { position: relative; }
        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: .3rem;
          padding: .5rem .7rem;
          font-size: var(--step--1);
          font-weight: 500;
          color: var(--ink-soft);
          text-decoration: none;
          border-radius: var(--radius);
          transition: color var(--dur) var(--ease), background var(--dur) var(--ease);
        }
        .nav-link:hover { color: var(--ink); background: var(--paper-sunk); }
        .nav-caret { opacity: .6; transition: transform var(--dur) var(--ease); }
        .nav-group:hover .nav-caret { transform: rotate(180deg); }

        .nav-menu {
          position: absolute;
          top: calc(100% + .45rem);
          left: -.4rem;
          min-width: 19rem;
          padding: .45rem;
          background: var(--paper-raised);
          border: 1px solid var(--rule);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lift);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-4px);
          transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease), visibility var(--dur);
        }
        .nav-group:hover .nav-menu,
        .nav-group:focus-within .nav-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .nav-menu-item {
          display: grid;
          gap: .12rem;
          padding: .6rem .7rem;
          border-radius: 6px;
          text-decoration: none;
          transition: background var(--dur) var(--ease);
        }
        .nav-menu-item:hover { background: var(--paper); }
        .nav-menu-label { font-size: var(--step--1); font-weight: 600; }
        .nav-menu-desc { font-size: var(--step--2); color: var(--ink-mute); line-height: 1.35; }

        .header-actions {
          display: flex;
          align-items: center;
          gap: .9rem;
          margin-left: auto;
        }
        .header-mail {
          font-family: var(--font-mono);
          font-size: var(--step--2);
          color: var(--ink-mute);
          text-decoration: none;
        }
        .header-mail:hover { color: var(--cobalt); }
        .header-cta { white-space: nowrap; }

        @media (max-width: 1080px) {
          .header-mail { display: none; }
        }
        @media (max-width: 920px) {
          .desk-nav { display: none; }
          .header-cta { display: none; }
        }
      `}</style>
    </header>
  );
}
