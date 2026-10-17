"use client";

import { useEffect, useRef, useState } from "react";

/** Fades content up once, on first scroll into view. Respects reduced motion. */
export default function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal--in" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity .5s var(--ease), transform .5s var(--ease);
          height: 100%;
        }
        .reveal--in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
