import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/class-names";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-lime text-zinc-950 shadow-[0_8px_24px_rgba(200,255,77,0.22)] hover:bg-brand-lime-strong",
  accent:
    "bg-brand-violet-strong text-white shadow-lg shadow-brand-violet/15 hover:brightness-95",
  secondary:
    "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
  ghost:
    "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
  danger:
    "border border-red-100 bg-white text-red-700 hover:bg-red-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 rounded-xl px-3 py-2 text-sm",
  md: "min-h-11 rounded-xl px-4 py-2.5 text-sm",
  lg: "min-h-12 rounded-xl px-5 py-3 text-sm",
};

export function buttonClassName({
  variant = "secondary",
  size = "md",
  block = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}) {
  return cx(
    "inline-flex items-center justify-center gap-2 font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20 disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    block && "w-full",
    className,
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
  }
>(function Button(
  { variant, size, block, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, block, className })}
      {...props}
    />
  );
});

