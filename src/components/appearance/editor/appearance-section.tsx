import type { ElementType, ReactNode } from "react";

export function AppearanceSection({ icon: Icon, title, description, children }: {
  icon: ElementType;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-zinc-500">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
