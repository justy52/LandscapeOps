import { cn } from "@/lib/cn";

const leadTone: Record<string, string> = {
  NEW: "bg-sky-50 text-sky-700 ring-sky-200",
  CONTACTED: "bg-stone-100 text-stone-700 ring-stone-200",
  QUALIFIED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ESTIMATE_REQUESTED: "bg-amber-50 text-amber-800 ring-amber-200",
  WON: "bg-landscape-pine/10 text-landscape-pine ring-landscape-pine/20",
  LOST: "bg-rose-50 text-rose-700 ring-rose-200",
};

const estimateTone: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-700 ring-stone-200",
  INTERNAL_REVIEW: "bg-amber-50 text-amber-800 ring-amber-200",
  SENT: "bg-sky-50 text-sky-700 ring-sky-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DECLINED: "bg-rose-50 text-rose-700 ring-rose-200",
  EXPIRED: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

const labels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  ESTIMATE_REQUESTED: "Estimate requested",
  WON: "Won",
  LOST: "Lost",
  DRAFT: "Draft",
  INTERNAL_REVIEW: "Internal review",
  SENT: "Sent",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export function StatusBadge({
  status,
  type,
  className,
}: {
  status: string;
  type: "lead" | "estimate";
  className?: string;
}) {
  const tone = type === "lead" ? leadTone[status] : estimateTone[status];

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        tone ?? "bg-stone-100 text-stone-700 ring-stone-200",
        className
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function statusLabel(status: string) {
  return labels[status] ?? status;
}
