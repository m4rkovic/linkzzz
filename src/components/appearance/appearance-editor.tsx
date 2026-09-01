"use client";

import { RotateCcw, Save } from "lucide-react";
import ProfilePreviewFrame from "@/components/ui/profile-preview-frame";
import type { VisitorLocation } from "@/types/profile";
import { CLASSIC_APPEARANCE_PRESETS, VISUAL_APPEARANCE_PRESETS } from "@/features/profile/appearance-presets";
import LayoutModeSection from "./editor/layout-mode-section";
import PresetsSection from "./editor/presets-section";
import PageSection from "./editor/page-section";
import TypographySection from "./editor/typography-section";
import ClassicButtonsSection from "./editor/classic-buttons-section";
import HeroSection from "./editor/hero-section";
import IdentitySection from "./editor/identity-section";
import CardsSection from "./editor/cards-section";
import { useAppearanceEditor } from "@/features/profile/use-appearance-editor";

const mockVisitor: VisitorLocation = { countryCode: "RS", countryName: "Serbia", flag: "🇷🇸" };

export default function AppearanceEditor() {
  const editor = useAppearanceEditor();

  return (
    <div className="grid w-full min-w-0 max-w-full gap-6 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-8">
      <div className="min-w-0 space-y-6">
        <LayoutModeSection value={editor.layoutMode} onChange={editor.changeLayoutMode} />
        <PresetsSection mode={editor.layoutMode} presets={editor.layoutMode === "classic" ? CLASSIC_APPEARANCE_PRESETS : VISUAL_APPEARANCE_PRESETS} onApply={editor.applyPreset} />
        <PageSection appearance={editor.appearance} page={editor.page} onAppearanceChange={editor.updateAppearance} onPageChange={editor.updatePage} />
        <TypographySection fontFamily={editor.appearance.fontFamily} onChange={(fontFamily) => editor.updateAppearance({ fontFamily })} />

        {editor.layoutMode === "classic" ? (
          <ClassicButtonsSection appearance={editor.appearance} onChange={editor.updateAppearance} />
        ) : (
          <>
            <HeroSection profile={editor.profile} hero={editor.hero} onChange={editor.updateHero} onCoverUpload={editor.handleCoverUpload} onRemoveCover={editor.removeCover} />
            <IdentitySection identity={editor.identity} onChange={editor.updateIdentity} />
            <CardsSection cards={editor.cards} onChange={editor.updateCards} />
          </>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={editor.resetAppearance} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"><RotateCcw size={16} />Reset</button>
          {editor.saved && <p className="text-center text-sm font-medium text-emerald-600 sm:ml-auto">Changes saved.</p>}
          {editor.saveError && <p className="text-center text-sm font-medium text-red-600 sm:ml-auto">{editor.saveError}</p>}
          <button type="button" onClick={editor.saveChanges} disabled={editor.saving} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:ml-auto"><Save size={16} />{editor.saving ? "Saving..." : "Save changes"}</button>
        </div>
      </div>

      <ProfilePreviewFrame profile={editor.profile} visitor={mockVisitor} badge={editor.layoutMode === "visual" ? "Visual" : "Classic"} subtitle="Appearance updates instantly" />
    </div>
  );
}
