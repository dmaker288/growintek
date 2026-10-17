"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAction } from "@/lib/actions/auth";

type User = { id: string; email: string; name: string | null; role: "ADMIN" | "EDITOR" };

const groups: {
  label: string;
  items: { href: string; label: string; icon: string; exact?: boolean }[];
}[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "grid", exact: true },
      { href: "/admin/analytics", label: "Analytics", icon: "chart" },
      { href: "/admin/reports", label: "Reports", icon: "report" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content/posts", label: "Journal", icon: "pen" },
      { href: "/admin/content/services", label: "Services", icon: "layers" },
      { href: "/admin/content/work", label: "Case studies", icon: "folder" },
      { href: "/admin/content/reviews", label: "Testimonials", icon: "quote" },
      { href: "/admin/media", label: "Media", icon: "image" },
    ],
  },
  {
    label: "Agency",
    items: [
      { href: "/admin/leads", label: "Leads", icon: "inbox" },
      { href: "/admin/clients", label: "Clients", icon: "users" },
      { href: "/admin/projects", label: "Projects", icon: "layers" },
      { href: "/admin/invoices", label: "Invoices", icon: "receipt" },
      { href: "/admin/finance", label: "Finance", icon: "coins" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/integrations", label: "Integrations", icon: "plug" },
      { href: "/admin/settings", label: "Settings", icon: "gear" },
    ],
  },
];

const ICONS: Record<string, React.ReactNode> = {
  grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
  chart: <path d="M4 20V9M10 20V4M16 20v-7M22 20H2" />,
  report: <path d="M6 2h9l5 5v15H6zM15 2v5h5M9 13h6M9 17h6M9 9h2" />,
  pen: <path d="m4 20 4-1 11-11-3-3L5 16l-1 4ZM15 5l3 3" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm9 9-9 5-9-5m18 4-9 5-9-5" />,
  folder: <path d="M3 7h6l2 2h10v11H3z" />,
  quote: <path d="M7 7h4v6H6V9m9-2h4v6h-5v-2" />,
  image: <path d="M3 4h18v16H3zM3 15l5-5 4 4 3-3 6 6" />,
  inbox: <path d="M3 12h5l2 3h4l2-3h5M5 5h14l2 7v7H3v-7l2-7Z" />,
  users: <path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-2a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8" />,
  receipt: <path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2V2ZM9 8h6M9 12h6M9 16h3" />,
  coins: <path d="M12 7c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3ZM4 4v6c0 1.7 3.6 3 8 3s8-1.3 8-3V4M4 10v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />,
  plug: <path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v5" />,
  gear: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 1-2.9 1.2 1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 1-2.2-1.6V19a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 1 4.6 17a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 1 1.6-2.2H4a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 1 6 4.6a1.7 1.7 0 0 1 2.4-2.4l.1.1A1.7 1.7 0 0 0 11 2.6V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.4 1.6 1.7 1.7 0 0 1 2.2 1.6V6a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.2" />,
};

export default function AdminShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const current = groups
    .flatMap((g) => g.items)
    .filter((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="admin">
      <aside className={`admin-side ${open ? "admin-side--open" : ""}`}>
        <div className="admin-brand">
          <Link href="/admin">
            <span className="admin-brand-mark" aria-hidden="true">G</span>
            <span>GrowinTek</span>
          </Link>
          <span className="admin-brand-sub">Agency OS</span>
        </div>

        <nav className="admin-nav" aria-label="Admin">
          {groups.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <p className="admin-nav-label">{group.label}</p>
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-link ${active ? "admin-link--on" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {ICONS[item.icon]}
                    </svg>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-side-foot">
          <Link href="/" target="_blank" className="admin-view-site">
            View site <span aria-hidden="true">↗</span>
          </Link>
          <div className="admin-user">
            <span className="admin-avatar" aria-hidden="true">
              {(user.name ?? user.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="admin-user-meta">
              <span className="admin-user-name">{user.name ?? "Admin"}</span>
              <span className="admin-user-role">{user.role.toLowerCase()}</span>
            </div>
            <form action={signOutAction}>
              <button type="submit" className="admin-signout" title="Sign out">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
                </svg>
                <span className="sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {open && <button className="admin-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}

      <div className="admin-main-col">
        <header className="admin-topbar">
          <button
            className="admin-burger"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <span /><span /><span />
          </button>
          <div className="admin-crumb">
            <span className="muted">{current?.label ?? "Admin"}</span>
          </div>
          <div className="admin-topbar-actions">
            <Link href="/admin/leads" className="admin-topbar-link">
              Leads
            </Link>
            <Link href="/" target="_blank" className="admin-topbar-link">
              Site <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>

      <style>{`
        .admin {
          --a-bg: #f6f4ef;
          --a-panel: #fffdf8;
          --a-ink: #17180f;
          --a-mute: #6d6a5b;
          --a-faint: #9a9684;
          --a-line: #e2dcce;
          --a-line-strong: #cdc5b3;
          --a-accent: #1b2ce0;
          --a-side: 15rem;
          min-height: 100svh;
          display: flex;
          background: var(--a-bg);
          color: var(--a-ink);
          font-family: var(--font-inter-tight), system-ui, sans-serif;
          font-size: .92rem;
        }

        .admin-side {
          position: fixed;
          inset: 0 auto 0 0;
          width: var(--a-side);
          background: #12130d;
          color: #e9e6da;
          display: flex;
          flex-direction: column;
          z-index: 60;
          border-right: 1px solid #24251b;
        }
        .admin-brand {
          padding: 1.1rem 1.1rem .9rem;
          border-bottom: 1px solid #24251b;
          display: grid;
          gap: .15rem;
        }
        .admin-brand a {
          display: inline-flex;
          align-items: center;
          gap: .55rem;
          text-decoration: none;
          color: #fff;
          font-family: var(--font-display), serif;
          font-size: 1.15rem;
          letter-spacing: -.02em;
        }
        .admin-brand-mark {
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border-radius: 5px;
          background: var(--a-accent);
          color: #fff;
          font-size: .8rem;
          font-weight: 600;
        }
        .admin-brand-sub {
          font-family: var(--font-mono), monospace;
          font-size: .6rem;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: #7d7a68;
          padding-left: 1.9rem;
        }

        .admin-nav { flex: 1; overflow-y: auto; padding: .9rem .6rem 1.5rem; }
        .admin-nav-group + .admin-nav-group { margin-top: 1.1rem; }
        .admin-nav-label {
          font-family: var(--font-mono), monospace;
          font-size: .58rem;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: #6f6c5a;
          padding: .3rem .55rem .45rem;
        }
        .admin-link {
          display: flex;
          align-items: center;
          gap: .65rem;
          padding: .5rem .55rem;
          border-radius: 6px;
          color: #b9b6a6;
          text-decoration: none;
          font-size: .85rem;
          transition: background .15s, color .15s;
        }
        .admin-link:hover { background: #1d1e16; color: #fff; }
        .admin-link--on { background: #1f2117; color: #fff; }
        .admin-link--on svg { color: #8f9bff; }
        .admin-link svg { flex: none; color: #7d7a68; }

        .admin-side-foot { border-top: 1px solid #24251b; padding: .75rem .6rem; display: grid; gap: .6rem; }
        .admin-view-site {
          display: block;
          padding: .45rem .55rem;
          font-size: .76rem;
          color: #8d8a78;
          text-decoration: none;
          border: 1px solid #2b2c21;
          border-radius: 6px;
          text-align: center;
        }
        .admin-view-site:hover { color: #fff; border-color: #3b3c2e; }
        .admin-user { display: flex; align-items: center; gap: .55rem; padding: .2rem .3rem; }
        .admin-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: grid; place-items: center;
          background: #2a2b20; color: #e9e6da;
          font-size: .75rem; font-weight: 600;
        }
        .admin-user-meta { display: grid; line-height: 1.2; min-width: 0; flex: 1; }
        .admin-user-name { font-size: .78rem; color: #e9e6da; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .admin-user-role { font-family: var(--font-mono), monospace; font-size: .58rem; color: #7d7a68; text-transform: uppercase; letter-spacing: .1em; }
        .admin-signout {
          display: grid; place-items: center;
          width: 30px; height: 30px; border-radius: 6px;
          color: #8d8a78; border: 1px solid transparent;
        }
        .admin-signout:hover { color: #fff; background: #1d1e16; }

        .admin-main-col {
          flex: 1;
          min-width: 0;
          margin-left: var(--a-side);
          display: flex;
          flex-direction: column;
        }
        .admin-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          height: 54px;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0 1.5rem;
          background: rgba(255, 253, 248, .88);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--a-line);
        }
        .admin-crumb { font-size: .8rem; }
        .admin-topbar-actions { margin-left: auto; display: flex; gap: 1rem; }
        .admin-topbar-link { font-size: .78rem; color: var(--a-mute); text-decoration: none; }
        .admin-topbar-link:hover { color: var(--a-accent); }
        .admin-content { padding: 1.75rem clamp(1rem, 3vw, 2.25rem) 4rem; }

        .admin-burger { display: none; width: 36px; height: 36px; padding: 8px; flex-direction: column; justify-content: space-between; }
        .admin-burger span { display: block; height: 1.5px; background: var(--a-ink); }
        .admin-scrim { display: none; }

        @media (max-width: 900px) {
          .admin-side { transform: translateX(-100%); transition: transform .22s var(--ease); }
          .admin-side--open { transform: none; }
          .admin-main-col { margin-left: 0; }
          .admin-burger { display: flex; }
          .admin-scrim {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(18,19,13,.42);
            z-index: 55;
            border: 0;
          }
          .admin-topbar { padding: 0 1rem; }
        }
      `}</style>
    </div>
  );
}
