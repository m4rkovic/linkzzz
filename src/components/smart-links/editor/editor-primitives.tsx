"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cardClassName } from "@/components/ui/card";
import { controlClassName } from "@/components/ui/form-control";
import type { SmartLinkStatus } from "@/types/smart-link";

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  compact = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
}) {
  return (
    <label className={`flex min-w-0 items-start justify-between gap-4 rounded-2xl ${compact ? "border border-zinc-200 p-4" : "bg-zinc-50 p-4 sm:p-5"}`}>
      <span className="min-w-0">
        <span className="block text-sm font-black text-zinc-950">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-zinc-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brand-violet"
      />
    </label>
  );
}

export function EditorPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={cardClassName({ padding: "none", className: "p-4 sm:p-6" })}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-violet-strong">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-black text-zinc-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-zinc-800">
      {label}
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1.5 block text-xs font-normal leading-5 text-zinc-400">{hint}</span>}
    </label>
  );
}

export function StatusBadge({ status }: { status: SmartLinkStatus }) {
  const tone = status === "PUBLISHED"
    ? "success"
    : status === "DISABLED"
      ? "danger"
      : "accent";

  return <Badge tone={tone}>{status}</Badge>;
}

export const inputClass = controlClassName();
