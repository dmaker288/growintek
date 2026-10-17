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
          background: rgba(11, 15, 25, 0.78);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
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
          text-decoration: none;
          flex: none;
          padding: 4px 0;
        }
        .header-logo-img {
          width: auto;
          height: 38px;
          object-fit: contain;
          border-radius: 4px;
        }

        .desk-nav {
          display: flex;
          align-items: center;
          gap: .25rem;
          margin-left: auto;
        }
        .nav-group { position: relative; }
        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          padding: .5rem .8rem;
          font-size: var(--step--1);
          font-weight: 500;
          color: var(--ink-soft);
          text-decoration: none;
          border-radius: var(--radius);
          transition: color var(--dur) var(--ease), background var(--dur) var(--ease);
        }
        .nav-link:hover { color: #ffffff; background: rgba(255, 255, 255, 0.06); }
        .nav-caret { opacity: .6; transition: transform var(--dur) var(--ease); }
        .nav-group:hover .nav-caret { transform: rotate(180deg); }

        .nav-menu {
          position: absolute;
          top: calc(100% + .5rem);
          left: 0;
          min-width: 20rem;
          padding: .5rem;
          background: rgba(17, 24, 39, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--rule-strong);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-6px);
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
          gap: .15rem;
          padding: .65rem .8rem;
          border-radius: 8px;
          text-decoration: none;
          transition: background var(--dur) var(--ease);
        }
        .nav-menu-item:hover { background: rgba(255, 255, 255, 0.06); }
        .nav-menu-label { font-size: var(--step--1); font-weight: 600; color: #ffffff; }
        .nav-menu-desc { font-size: var(--step--2); color: var(--ink-mute); line-height: 1.35; }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-left: auto;
        }
        .header-mail {
          font-family: var(--font-mono);
          font-size: var(--step--2);
          color: var(--ink-mute);
          text-decoration: none;
        }
        .header-mail:hover { color: var(--accent); }
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
