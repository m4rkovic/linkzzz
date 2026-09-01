import { Check, MonitorSmartphone } from "lucide-react";
import type { ReactNode } from "react";
import { AppearanceSection } from "./appearance-section";
import type { ProfileLayoutMode } from "@/types/profile";

export default function LayoutModeSection({ value, onChange }: {
  value: ProfileLayoutMode;
  onChange: (value: ProfileLayoutMode) => void;
}) {
  return (
    <AppearanceSection icon={MonitorSmartphone} title="Profile layout" description="Choose the overall structure of your public profile.">
      <div className="grid gap-3 sm:grid-cols-2">
        <LayoutModeCard title="Classic" description="The original Linkzzz layout with clean buttons." selected={value === "classic"} onClick={() => onChange("classic")}>
          <ClassicLayoutPreview />
        </LayoutModeCard>
        <LayoutModeCard title="Visual" description="Hero images, visual cards and mixed layouts." selected={value === "visual"} onClick={() => onChange("visual")}>
          <VisualLayoutPreview />
        </LayoutModeCard>
      </div>
    </AppearanceSection>
  );
}

function LayoutModeCard({ title, description, selected, onClick, children }: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"}`}>
      {selected && <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-950"><Check size={14} /></div>}
      {children}
      <p className="mt-4 text-sm font-bold">{title}</p>
      <p className={`mt-1 text-xs leading-5 ${selected ? "text-zinc-400" : "text-zinc-500"}`}>{description}</p>
    </button>
  );
}

function ClassicLayoutPreview() {
  return <div className="mt-2 flex h-28 flex-col items-center justify-center rounded-xl bg-zinc-100 p-3"><div className="h-7 w-7 rounded-full bg-zinc-300" /><div className="mt-2 h-2 w-16 rounded bg-zinc-300" /><div className="mt-3 h-5 w-full rounded-md bg-zinc-300" /><div className="mt-1.5 h-5 w-full rounded-md bg-zinc-300" /></div>;
}

function VisualLayoutPreview() {
  return <div className="mt-2 h-28 overflow-hidden rounded-xl bg-zinc-900 p-2"><div className="h-8 rounded-md bg-zinc-700" /><div className="relative -mt-3 ml-3 h-7 w-7 rounded-full border-2 border-zinc-900 bg-zinc-400" /><div className="mt-2 grid grid-cols-2 gap-1.5"><div className="h-10 rounded-md bg-zinc-700" /><div className="h-10 rounded-md bg-zinc-600" /></div></div>;
}
