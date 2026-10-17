"use client";

import { useState } from "react";

export default function CopyButton({ value, label = "Copy URL" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="a-btn a-btn--sm a-btn--ghost" onClick={copy}>
      {copied ? "Copied" : label}
    </button>
  );
}
