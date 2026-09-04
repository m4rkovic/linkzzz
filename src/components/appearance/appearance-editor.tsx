"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";

import ProfilePreviewFrame from "@/components/ui/profile-preview-frame";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import type { VisitorLocation } from "@/types/profile";
import {
  CLASSIC_APPEARANCE_PRESETS,
  VISUAL_APPEARANCE_PRESETS,
} from "@/features/profile/appearance-presets";
import { useAppearanceEditor } from "@/features/profile/use-appearance-editor";

import AppearanceEditorNavigation, {
  getAppearancePanels,
  type AppearancePanel,
} from "./editor/appearance-editor-navigation";
import LayoutModeSection from "./editor/layout-mode-section";
import PresetsSection from "./editor/presets-section";
import PageSection from "./editor/page-section";
import TypographySection from "./editor/typography-section";
import ClassicButtonsSection from "./editor/classic-buttons-section";
import HeroSection from "./editor/hero-section";
import IdentitySection from "./editor/identity-section";
import CardsSection from "./editor/cards-section";

const mockVisitor: VisitorLocation = {
  countryCode: "RS",
  countryName: "Serbia",
  flag: "🇷🇸",
};

export default function AppearanceEditor({ showPreview = true }: { showPreview?: boolean }) {
  const editor = useAppearanceEditor();
  const [requestedPanel, setRequestedPanel] = useState<AppearancePanel>("layout");
  const [resetOpen, setResetOpen] = useState(false);
  const availablePanels = getAppearancePanels(editor.layoutMode);
  const activePanel = availablePanels.some((panel) => panel.id === requestedPanel)
    ? requestedPanel
    : "layout";

  return (
    <div className={`grid w-full min-w-0 max-w-full gap-6 ${showPreview ? "2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-8" : ""}`}>
      <div className="min-w-0">
        <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-violet-strong">
                Appearance editor
              </p>
              <p aria-live="polite" className="mt-1 text-xs font-semibold">
                {editor.dirty && !editor.saving && !editor.saveError && !editor.saved && (
                  <span className="text-amber-700">Unsaved appearance changes</span>
                )}
                {editor.saved && <span className="text-emerald-700">Changes saved.</span>}
                {editor.saveError && <span className="text-red-700">{editor.saveError}</span>}
                {!editor.dirty && !editor.saved && !editor.saveError && (
                  <span className="text-zinc-500">All appearance changes are saved</span>
                )}
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
              <Button variant="secondary" onClick={() => setResetOpen(true)}>
                <RotateCcw size={16} /> Reset
              </Button>
              <Button
                variant="primary"
                onClick={() => void editor.saveChanges()}
                disabled={editor.saving || !editor.dirty}
                className="sm:min-w-36"
              >
                <Save size={16} />
                {editor.saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[156px_minmax(0,1fr)]">
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <AppearanceEditorNavigation
              layoutMode={editor.layoutMode}
              activePanel={activePanel}
              onSelect={setRequestedPanel}
            />
          </div>

          <div className="min-w-0">
            {activePanel === "layout" && (
              <LayoutModeSection
                value={editor.layoutMode}
                onChange={(mode) => {
                  editor.changeLayoutMode(mode);
                  setRequestedPanel("layout");
                }}
              />
            )}

            {activePanel === "presets" && (
              <PresetsSection
                mode={editor.layoutMode}
                presets={
                  editor.layoutMode === "classic"
                    ? CLASSIC_APPEARANCE_PRESETS
                    : VISUAL_APPEARANCE_PRESETS
                }
                onApply={editor.applyPreset}
              />
            )}

            {activePanel === "background" && (
              <PageSection
                panel="background"
                appearance={editor.appearance}
                page={editor.page}
                onAppearanceChange={editor.updateAppearance}
                onPageChange={editor.updatePage}
              />
            )}

            {activePanel === "spacing" && (
              <PageSection
                panel="layout"
                appearance={editor.appearance}
                page={editor.page}
                onAppearanceChange={editor.updateAppearance}
                onPageChange={editor.updatePage}
              />
            )}

            {activePanel === "typography" && (
              <TypographySection
                appearance={editor.appearance}
                onChange={editor.updateAppearance}
              />
            )}

            {activePanel === "buttons" && editor.layoutMode === "classic" && (
              <ClassicButtonsSection
                appearance={editor.appearance}
                onChange={editor.updateAppearance}
              />
            )}

            {activePanel === "hero" && editor.layoutMode === "visual" && (
              <HeroSection
                profile={editor.profile}
                hero={editor.hero}
                onChange={editor.updateHero}
                onCoverUpload={editor.handleCoverUpload}
                onRemoveCover={editor.removeCover}
              />
            )}

            {activePanel === "identity" && editor.layoutMode === "visual" && (
              <IdentitySection
                identity={editor.identity}
                onChange={editor.updateIdentity}
              />
            )}

            {activePanel === "cards" && editor.layoutMode === "visual" && (
              <CardsSection cards={editor.cards} onChange={editor.updateCards} />
            )}
          </div>
        </div>

      </div>

      {showPreview && (
        <ProfilePreviewFrame
          profile={editor.profile}
          visitor={mockVisitor}
          badge={editor.layoutMode === "visual" ? "Visual" : "Classic"}
          subtitle="Appearance updates instantly"
        />
      )}

      <ConfirmDialog
        open={resetOpen}
        title="Reset appearance?"
        description="This replaces the current appearance settings with the default Linkzzz style. Nothing is permanent until you save."
        confirmLabel="Reset appearance"
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          editor.resetAppearance();
          setResetOpen(false);
        }}
      />
    </div>
  );
}
