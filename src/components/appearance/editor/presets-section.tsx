import { Sparkles } from "lucide-react";
import { AppearanceSection } from "./appearance-section";
import type { AppearancePreset } from "@/features/profile/appearance-presets";

export default function PresetsSection({ mode, presets, onApply }: {
  mode: "classic" | "visual";
  presets: AppearancePreset[];
  onApply: (preset: AppearancePreset) => void;
}) {
  return (
    <AppearanceSection icon={Sparkles} title={`${mode === "classic" ? "Classic" : "Visual"} presets`} description={`Only ${mode} starting points are shown. Switching layout does not apply a preset automatically.`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {presets.map((preset) => (
          <button key={preset.id} type="button" onClick={() => onApply(preset)} className="group rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-sm">
            <div className="mb-4 flex h-14 overflow-hidden rounded-xl border border-black/5">{preset.swatches.map((color) => <span key={color} className="flex-1" style={{ backgroundColor: color }} />)}</div>
            <p className="text-sm font-bold text-zinc-900">{preset.name}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{preset.description}</p>
          </button>
        ))}
      </div>
    </AppearanceSection>
  );
}
