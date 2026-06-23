import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

type DashboardCardProps = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  trendDirection: "up" | "down";
  icon: LucideIcon;
};

export function DashboardCard({
  label,
  value,
  detail,
  trend,
  trendDirection,
  icon: Icon
}: DashboardCardProps) {
  const TrendIcon = trendDirection === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <article className="premium-surface rounded-lg border border-landscape-cream/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-landscape-pine text-landscape-cream">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            trendDirection === "up"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {trend}
        </span>
      </div>
      <p className="mt-5 text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-normal text-landscape-graphite">{value}</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{detail}</p>
    </article>
  );
}
