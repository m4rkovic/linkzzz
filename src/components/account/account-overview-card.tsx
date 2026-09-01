import type { ElementType } from "react";

export default function AccountOverviewCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
        <Icon size={18} />
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-zinc-900">
        {value}
      </p>
    </div>
  );
}
