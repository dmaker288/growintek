import { useEffect } from "react";
export default function useHomeMotion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) return;
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".home-page .service-card, .home-page .process-step, .home-page .industry-item, .home-page .post-card, .home-page .project-card, .home-page .faq-answer-card",
      ),
    );
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px 20px 0px" },
    );
    nodes.forEach((node, i) => {
      node.style.setProperty("--reveal-delay", `${(i % 3) * 65}ms`);
      node.classList.add("motion-ready");
      observer.observe(node);
    });
    const revealAll = () => {
      if (reduced.matches)
        nodes.forEach((n) => n.classList.add("motion-visible"));
    };
    reduced.addEventListener("change", revealAll);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", revealAll);
      nodes.forEach((n) =>
        n.classList.remove("motion-ready", "motion-visible"),
      );
    };
  }, []);
}
