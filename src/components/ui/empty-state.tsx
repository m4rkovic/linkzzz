import type { ReactNode } from "react";

import { cx } from "@/lib/class-names";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-12 text-center", className)}>
      {icon ? <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">{icon}</div> : null}
      <h2 className="mt-3 text-sm font-black text-zinc-900">{title}</h2>
      {description ? <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
