"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party pageview + CTA tracking. No cookies, no third-party script.
 * Sends via sendBeacon so it never delays navigation.
 */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const payload = JSON.stringify({
      type: "pageview",
      path: pathname,
      referrer: document.referrer || null,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    // Delegated CTA tracking: any element with data-cta reports a click.
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest("[data-cta]");
      if (!target) return;
      const label = target.getAttribute("data-cta");
      if (!label) return;

      const payload = JSON.stringify({
        type: "cta",
        path: window.location.pathname,
        label,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
