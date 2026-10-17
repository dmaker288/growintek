"use client";

import { usePathname } from "next/navigation";

/**
 * The admin area renders its own full-height shell, so the public header and
 * footer must not wrap it. Reading the pathname on the client is the only way
 * to do this from a single root layout, since layouts cannot read the URL.
 */
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
