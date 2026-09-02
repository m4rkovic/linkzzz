import type { HTMLAttributes } from "react";

import { cx } from "@/lib/class-names";

export type CardPadding = "none" | "sm" | "md" | "lg";

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-5 sm:p-6",
};

export function cardClassName({
  padding = "md",
  interactive = false,
  className,
}: {
  padding?: CardPadding;
  interactive?: boolean;
  className?: string;
} = {}) {
  return cx(
    "min-w-0 rounded-2xl border border-zinc-200 bg-white",
    paddingClasses[padding],
    interactive && "transition hover:border-brand-violet/35 hover:shadow-sm",
    className,
  );
}

export function Card({
  padding,
  interactive,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  padding?: CardPadding;
  interactive?: boolean;
}) {
  return <div className={cardClassName({ padding, interactive, className })} {...props} />;
}

