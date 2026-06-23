import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

type DashboardCardProps = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  trendLabel: string;
  trendDirection: "up" | "down" | "neutral";
  tone: "green" | "brass" | "blue" | "red";
  progress: number;
  icon: LucideIcon;
};

const toneStyles = {
  green: {
    icon: "bg-emerald-950 text-emerald-100",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bar: "bg-emerald-600"
  },
  brass: {
    icon: "bg-landscape-brass text-landscape-graphite",
    chip: "bg-amber-50 text-amber-800 ring-amber-200",
    bar: "bg-landscape-brass"
  },
  blue: {
    icon: "bg-sky-950 text-sky-100",
    chip: "bg-sky-50 text-sky-700 ring-sky-200",
    bar: "bg-sky-500"
  },
  red: {
    icon: "bg-rose-950 text-rose-100",
    chip: "bg-rose-50 text-rose-700 ring-rose-200",
    bar: "bg-rose-500"
  }
};

export function DashboardCard({
  label,
  value,
  detail,
  trend,
  trendLabel,
  trendDirection,
  tone,
  progress,
  icon: Icon
}: DashboardCardProps) {
  const TrendIcon =
    trendDirection === "up" ? ArrowUpRight : trendDirection === "down" ? ArrowDownRight : Minus;
  const styles = toneStyles[tone];

  return (
    <article className="premium-card group relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-landscape-brass/50 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg shadow-inset", styles.icon)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            styles.chip
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {trend}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-stone-500">{label}</p>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-3xl font-semibold tracking-normal text-landscape-graphite">{value}</p>
          <p className="pb-1 text-xs font-semibold uppercase text-stone-500">{trendLabel}</p>
        </div>
        <p className="mt-2 min-h-12 text-sm leading-6 text-stone-600">{detail}</p>
      </div>

      <div className="mt-5" aria-hidden="true">
        <div className="h-1.5 rounded-full bg-stone-200/80">
          <div className={cn("h-1.5 rounded-full", styles.bar)} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </article>
  );
}
