"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  icon?: LucideIcon;
  tone?: "primary" | "secondary" | "ghost";
  className?: string;
  name?: string;
  value?: string;
};

const toneStyles = {
  primary:
    "bg-landscape-brass text-landscape-graphite hover:bg-[#c59844] focus:ring-landscape-brass",
  secondary:
    "border border-stone-300 bg-white/80 text-landscape-graphite hover:border-landscape-brass/50 hover:bg-white focus:ring-landscape-brass",
  ghost:
    "border border-white/12 bg-white/8 text-landscape-cream hover:bg-white/14 focus:ring-landscape-brass",
};

export function SubmitButton({
  label,
  pendingLabel = "Saving",
  icon: Icon,
  tone = "primary",
  className,
  name,
  value,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-landscape-cream disabled:cursor-not-allowed disabled:opacity-60",
        toneStyles[tone],
        className
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
