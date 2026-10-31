import type { CSSProperties } from "react";

export type IconName =
  | "arrow"
  | "robot"
  | "code"
  | "wordpress"
  | "search"
  | "megaphone"
  | "pen"
  | "team"
  | "settings"
  | "shield"
  | "globe"
  | "clock"
  | "check"
  | "menu"
  | "close"
  | "play"
  | "heart";

const paths: Partial<Record<IconName, React.ReactNode>> = {
  arrow: (
    <>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </>
  ),
  robot: (
    <>
      <path d="M12 4V2m-2 0h4M5 8H4a2 2 0 0 0-2 2v6h3m14-8h1a2 2 0 0 1 2 2v6h-3" />
      <rect x="5" y="6" width="14" height="14" rx="4" />
      <path d="M9 16h6" />
      <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  code: (
    <>
      <path d="m7 6-6 6 6 6m10-12 6 6-6 6M14 3l-4 18" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="7.5" />
      <path d="m16 16 6 6" />
    </>
  ),
  megaphone: (
    <>
      <path d="m3 9 13-5v16L3 15V9ZM7 17l1 5h4l-2-5M20 8l2-2m-2 10 2 2m-2-6h3" />
    </>
  ),
  pen: (
    <>
      <path d="m15 3 6 6M3 21l1.8-7.8L16 2a2.5 2.5 0 0 1 3.5 0L22 4.5A2.5 2.5 0 0 1 22 8L10.8 19.2 3 21Z" />
      <path d="m5 13 6 6" />
    </>
  ),
  team: (
    <>
      <circle cx="12" cy="6" r="3" />
      <path d="M6 22v-3a6 6 0 0 1 12 0v3H6Zm-3-9a4 4 0 0 0-2 4v2h2m18-6a4 4 0 0 1 2 4v2h-2M4 4a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6" />
    </>
  ),
  settings: (
    <>
      <path d="m10 2-1 3-3-1-2 3 2 2-1 3-3 1 1 4h3l2 2v3h4l1-3 3-1 2 2 3-3-2-2 1-3 3-1-1-4h-3l-2-2V2h-4Z" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2c3 3 6 4 9 4v7c0 5-6 8-9 10-3-2-9-5-9-10V6c3 0 6-1 9-4Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4" ry="10" />
      <path d="M3 7h18M2 12h20M3 17h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  play: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" stroke="none" />
    </>
  ),
  heart: <path d="M12 21 3 12a5.5 5.5 0 0 1 9-7 5.5 5.5 0 0 1 9 7l-9 9Z" />,
};

export default function Icon({
  name,
  className,
  style,
}: {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}) {
  if (name === "wordpress")
    return (
      <span
        aria-hidden="true"
        className={`wordpress-icon ${className ?? ""}`}
        style={style}
      >
        W
      </span>
    );
  return (
    <svg
      className={className}
      style={style}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
