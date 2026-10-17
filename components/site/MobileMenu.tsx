"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NavItem } from "@/lib/site";

export default function MobileMenu({ nav }: { nav: NavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mobile-menu-root">
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`bar ${open ? "bar-x1" : ""}`} />
        <span className={`bar ${open ? "bar-x2" : ""}`} />
      </button>

      {open && (
        <div
          id="mobile-nav"
          className="mobile-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="mobile-panel-inner">
            <p className="eyebrow">Menu</p>
            <ul className="mobile-list">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="mobile-link" onClick={() => setOpen(false)}>
                    {item.label}
                  </Link>
                  {item.children && (
                    <ul className="mobile-sub">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="mobile-sublink"
                            onClick={() => setOpen(false)}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              <li>
                <Link href="/about" className="mobile-link" onClick={() => setOpen(false)}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="mobile-link" onClick={() => setOpen(false)}>
                  Contact
                </Link>
              </li>
            </ul>
            <Link
              href="/contact"
              className="btn btn--cobalt mobile-cta"
              onClick={() => setOpen(false)}
            >
              Book an intro call
            </Link>
            <p className="tiny muted mobile-foot">
              Replies within one working day, usually within a few hours.
            </p>
          </div>
        </div>
      )}

      <style>{`
        .mobile-menu-root { display: none; }
        @media (max-width: 920px) {
          .mobile-menu-root { display: block; }

          .menu-toggle {
            width: 42px;
            height: 42px;
            display: grid;
            place-content: center;
            gap: 5px;
            border: 1px solid var(--rule-strong);
            border-radius: var(--radius);
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(8px);
          }
          .bar {
            display: block;
            width: 20px;
            height: 2px;
            border-radius: 2px;
            background: var(--ink);
            transition: transform var(--dur) var(--ease), opacity var(--dur) var(--ease);
          }
          .bar-x1 { transform: translateY(3.5px) rotate(45deg); }
          .bar-x2 { transform: translateY(-3.5px) rotate(-45deg); }

          .mobile-panel {
            position: fixed;
            inset: var(--header-h) 0 0 0;
            background: rgba(11, 15, 25, 0.96);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            overflow-y: auto;
            overscroll-behavior: contain;
            z-index: 49;
            animation: panel-in .25s var(--ease);
            border-top: 1px solid var(--rule);
          }
          @keyframes panel-in {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: none; }
          }
          .mobile-panel-inner {
            padding: var(--s-5) var(--gutter) var(--s-8);
            display: grid;
            gap: var(--s-5);
            align-content: start;
          }
          .mobile-list { display: grid; gap: .25rem; }
          .mobile-list > li { border-bottom: 1px solid var(--rule); padding-bottom: .6rem; }
          .mobile-link {
            display: block;
            padding: .75rem 0 .4rem;
            font-family: var(--font-display);
            font-size: 1.5rem;
            font-weight: 500;
            letter-spacing: -.02em;
            text-decoration: none;
            color: var(--ink);
          }
          .mobile-sub {
            display: grid;
            grid-template-columns: 1fr;
            gap: .4rem;
            padding: .4rem 0 .6rem;
          }
          .mobile-sublink {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: .6rem .85rem;
            border: 1px solid var(--rule);
            border-radius: var(--radius);
            font-size: var(--step--1);
            color: var(--ink-soft);
            text-decoration: none;
            background: rgba(255, 255, 255, 0.03);
            transition: background var(--dur) var(--ease);
          }
          .mobile-sublink:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
          }
          .mobile-cta { width: 100%; justify-content: center; margin-top: var(--s-2); }
          .mobile-foot { text-align: center; }
        }
      `}</style>
    </div>
  );
}
