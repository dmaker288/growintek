import Link from "next/link";
import Image from "next/image";
import { site, footerNav } from "@/lib/site";
import Newsletter from "./Newsletter";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="footer-wordmark" aria-label="GrowinTek home">
              <Image
                src="/images/logo-wide.webp"
                alt="GrowinTek"
                width={154}
                height={40}
                className="footer-logo-img"
              />
            </Link>
            <p className="footer-tagline">
              Websites that sell, agents that answer, systems that keep working
              after launch.
            </p>
            <Newsletter />
          </div>

          <nav className="footer-cols" aria-label="Footer">
            {footerNav.map((group) => (
              <div key={group.heading} className="footer-col">
                <p className="eyebrow">{group.heading}</p>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer-meta">
          <p>
            <span className="mono">© {year} {site.name}</span>
            <span className="footer-dot" aria-hidden="true">·</span>
            {site.location}
          </p>
          <div className="footer-social">
            <a href={site.social.linkedin} rel="me noopener" target="_blank">
              LinkedIn
            </a>
            <a href={site.social.instagram} rel="me noopener" target="_blank">
              Instagram
            </a>
            <a href={site.social.youtube} rel="me noopener" target="_blank">
              YouTube
            </a>
            <a href={site.social.facebook} rel="me noopener" target="_blank">
              Facebook
            </a>
          </div>
          <p className="footer-status">
            <span className="dot" aria-hidden="true" />
            Taking on 2 projects · {new Date().toLocaleString("en-GB", { month: "long" })}
          </p>
        </div>
      </div>

      <style>{`
        .site-footer {
          border-top: 1px solid var(--rule);
          background: var(--paper);
          padding-top: clamp(3rem, 6vw, 5rem);
        }
        .footer-top {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.6fr);
          gap: var(--s-8);
          padding-bottom: var(--s-7);
        }
        .footer-brand { max-width: 24rem; display: grid; gap: var(--s-4); align-content: start; }
        .footer-wordmark {
          display: inline-flex;
          text-decoration: none;
        }
        .footer-logo-img {
          width: auto;
          height: 38px;
          object-fit: contain;
          border-radius: 4px;
        }
        .footer-tagline {
          font-size: var(--step--1);
          color: var(--ink-mute);
          line-height: 1.55;
          max-width: 30ch;
        }
        .footer-cols {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--s-5);
        }
        .footer-col { display: grid; gap: var(--s-3); align-content: start; }
        .footer-col ul { display: grid; gap: .55rem; }
        .footer-col a {
          font-size: var(--step--1);
          color: var(--ink-soft);
          text-decoration: none;
        }
        .footer-col a:hover { color: var(--cobalt); text-decoration: underline; text-underline-offset: .18em; }

        .footer-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--s-3) var(--s-5);
          padding-block: var(--s-4) var(--s-5);
          border-top: 1px solid var(--rule);
          font-size: var(--step--2);
          color: var(--ink-mute);
        }
        .footer-meta p { display: inline-flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
        .footer-dot { color: var(--rule-strong); }
        .footer-social { display: flex; flex-wrap: wrap; gap: 1rem; }
        .footer-social a { text-decoration: none; color: var(--ink-soft); }
        .footer-social a:hover { color: var(--cobalt); }
        .footer-status { color: var(--ink-soft); }
        .footer-status .dot { background: #4d7a3a; }

        @media (max-width: 1000px) {
          .footer-top { grid-template-columns: 1fr; gap: var(--s-6); }
          .footer-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-6) var(--s-5); }
        }
        @media (max-width: 560px) {
          .footer-cols { grid-template-columns: 1fr 1fr; }
          .footer-meta { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </footer>
  );
}
