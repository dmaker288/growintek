const MAP: Record<string, { label: string; cls: string }> = {
  NEW: { label: "New", cls: "pill--blue" },
  QUALIFIED: { label: "Qualified", cls: "pill--green" },
  PROPOSAL: { label: "Proposal", cls: "pill--amber" },
  WON: { label: "Won", cls: "pill--green" },
  LOST: { label: "Lost", cls: "pill--grey" },
  DRAFT: { label: "Draft", cls: "pill--grey" },
  SENT: { label: "Sent", cls: "pill--blue" },
  PAID: { label: "Paid", cls: "pill--green" },
  OVERDUE: { label: "Overdue", cls: "pill--red" },
  VOID: { label: "Void", cls: "pill--grey" },
  PLANNING: { label: "Planning", cls: "pill--grey" },
  IN_PROGRESS: { label: "In progress", cls: "pill--blue" },
  REVIEW: { label: "Review", cls: "pill--amber" },
  LAUNCHED: { label: "Launched", cls: "pill--green" },
  PAUSED: { label: "Paused", cls: "pill--amber" },
  CLOSED: { label: "Closed", cls: "pill--grey" },
  PUBLISHED: { label: "Published", cls: "pill--green" },
  ARCHIVED: { label: "Archived", cls: "pill--grey" },
};

export default function StatusPill({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: "pill--grey" };
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}
