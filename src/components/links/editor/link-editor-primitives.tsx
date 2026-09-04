import type { ElementType, ReactNode } from "react";
import type { LinkCardAspectRatio, LinkCardLayout } from "@/types/profile";

export function EditorSection({ title, description, icon: Icon, children }: { title: string; description: string; icon?: ElementType; children: ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        {Icon && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong"><Icon size={16} /></div>}
        <div><h3 className="text-sm font-bold text-zinc-950">{title}</h3><p className="mt-1 text-xs leading-5 text-zinc-400">{description}</p></div>
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-500">{children}</span>;
}

export function ActionButton({ label, onClick, danger = false, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className={`flex h-10 w-9 items-center justify-center rounded-xl transition sm:w-10 ${danger ? "text-zinc-400 hover:bg-red-50 hover:text-red-600" : "text-zinc-400 hover:bg-brand-violet-soft hover:text-brand-violet-strong"}`}>{children}</button>;
}

export function CardLayoutIcon({ layout, selected }: { layout: LinkCardLayout; selected: boolean }) {
  const border = selected ? "border-white/40" : "border-zinc-300";
  const fill = selected ? "bg-white/20" : "bg-zinc-100";
  if (layout === "button") return <div className={`h-5 w-full rounded-md border ${border} ${fill}`} />;
  if (layout === "compact") return <div className={`h-7 w-1/2 rounded-md border ${border} ${fill}`} />;
  if (layout === "half") return <div className="flex gap-1"><div className={`h-8 flex-1 rounded-md border ${border} ${fill}`} /><div className={`h-8 flex-1 rounded-md border ${border} ${fill}`} /></div>;
  if (layout === "featured") return <div className={`h-11 w-full rounded-md border ${border} ${fill}`} />;
  return <div className={`h-8 w-full rounded-md border ${border} ${fill}`} />;
}

export function AspectRatioButton({ label, ratio, selected, onClick }: { label: string; ratio: LinkCardAspectRatio; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-h-[90px] flex-col items-center justify-center rounded-xl border p-3 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20 ${selected ? "border-brand-violet-strong bg-brand-violet-strong text-white shadow-sm" : "border-zinc-200 bg-white text-zinc-700 hover:border-brand-violet/50 hover:bg-brand-violet-soft/40"}`}>
      <AspectRatioShape ratio={ratio} selected={selected} />
      <span className="mt-3 text-[11px] font-bold">{label}</span>
    </button>
  );
}

function AspectRatioShape({ ratio, selected }: { ratio: LinkCardAspectRatio; selected: boolean }) {
  const styleClass = selected ? "border-white/50 bg-white/20" : "border-zinc-300 bg-zinc-100";
  if (ratio === "square") return <div className={`h-8 w-8 rounded-md border ${styleClass}`} />;
  if (ratio === "portrait") return <div className={`h-10 w-7 rounded-md border ${styleClass}`} />;
  if (ratio === "wide") return <div className={`h-6 w-11 rounded-md border ${styleClass}`} />;
  if (ratio === "landscape") return <div className={`h-7 w-10 rounded-md border ${styleClass}`} />;
  return <div className={`flex h-8 w-10 items-center justify-center rounded-md border border-dashed ${styleClass}`}><span className="text-[8px] font-bold">AUTO</span></div>;
}
