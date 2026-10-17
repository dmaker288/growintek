"use client";

export default function PrintButton() {
  return (
    <div className="print-bar">
      <button type="button" className="a-btn a-btn--primary" onClick={() => window.print()}>
        Print or save as PDF
      </button>
    </div>
  );
}
