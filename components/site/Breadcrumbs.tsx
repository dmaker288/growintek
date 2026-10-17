import Link from "next/link";
import { breadcrumbNode, graph } from "@/lib/schema";
import JsonLd from "./JsonLd";

/**
 * Visible breadcrumbs plus the matching BreadcrumbList schema. Keeping them in
 * one component means the markup and the structured data can never drift.
 */
export default function Breadcrumbs({
  items,
}: {
  items: { name: string; path: string; current?: boolean }[];
}) {
  return (
    <>
      <JsonLd data={graph([breadcrumbNode(items.map(({ name, path }) => ({ name, path })))])} />
      <nav className="crumbs tiny mono" aria-label="Breadcrumb">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <span key={item.path} className="crumb">
              {item.path !== "" && !last ? (
                <Link href={item.path}>{item.name}</Link>
              ) : (
                <span aria-current={last ? "page" : undefined}>{item.name}</span>
              )}
              {!last && <span className="crumb-sep" aria-hidden="true">/</span>}
            </span>
          );
        })}
      </nav>

      <style>{`
        .crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; color: var(--ink-faint); margin-bottom: var(--s-5); text-transform: uppercase; letter-spacing: .08em; font-size: var(--step--2); }
        .crumb { display: inline-flex; align-items: center; gap: .35rem; }
        .crumb a { color: var(--ink-mute); text-decoration: none; }
        .crumb a:hover { color: var(--cobalt); }
        .crumb-sep { color: var(--rule-strong); }
        [aria-current="page"] { color: var(--ink-soft); }
      `}</style>
    </>
  );
}
