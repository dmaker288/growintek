export default function LegalStyles() {
  return (
    <style>{`
      .legal { padding-block: clamp(2.5rem, 6vw, 4.5rem); }
      .legal-title { font-size: var(--step-5); letter-spacing: -.035em; margin-top: .6rem; }
      .legal-updated { font-size: var(--step--2); color: var(--ink-faint); margin-top: .6rem; text-transform: uppercase; letter-spacing: .08em; }
      .notice {
        margin: var(--s-5) 0 var(--s-6);
        padding: var(--s-4);
        border-left: 2px solid var(--clay);
        background: var(--clay-wash);
        font-size: var(--step--1);
        line-height: 1.6;
        color: #6d3a22;
        border-radius: 0 var(--radius) var(--radius) 0;
      }
      .legal-body { margin-top: var(--s-5); }
      .legal-body h2 { font-family: var(--font-display); font-size: var(--step-2); margin-top: 2em; }
      .legal-body h2:first-child { margin-top: 0; }
      .legal-body code { font-family: var(--font-mono); font-size: .85em; background: var(--paper-sunk); padding: .1em .3em; border-radius: 3px; }
    `}</style>
  );
}
