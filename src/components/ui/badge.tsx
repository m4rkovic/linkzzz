import type { HTMLAttributes } from "react";

import { cx } from "@/lib/class-names";

export type BadgeTone = "success" | "accent" | "danger" | "warning" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-brand-lime-soft text-zinc-800",
  accent: "bg-brand-violet-soft text-brand-violet-strong",
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  neutral: "bg-zinc-100 text-zinc-600",
};

export function badgeClassName({
  tone = "neutral",
  className,
}: {
  tone?: BadgeTone;
  className?: string;
} = {}) {
  return cx(
    "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
    toneClasses[tone],
    className,
  );
}

export function Badge({
  tone,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={badgeClassName({ tone, className })} {...props} />;
}

