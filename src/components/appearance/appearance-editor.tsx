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

export default function AppearanceEditor() {
  const editor = useAppearanceEditor();
  const [requestedPanel, setRequestedPanel] = useState<AppearancePanel>("layout");
  const [resetOpen, setResetOpen] = useState(false);
  const availablePanels = getAppearancePanels(editor.layoutMode);
  const activePanel = availablePanels.some((panel) => panel.id === requestedPanel)
    ? requestedPanel
    : "layout";

  return (
    <div className="grid w-full min-w-0 max-w-full gap-6 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-8">
      <div className="min-w-0">
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

        <div className="sticky bottom-3 z-30 mt-4 rounded-2xl border border-zinc-200/90 bg-white/95 p-3 shadow-[0_14px_40px_rgba(24,24,27,0.12)] backdrop-blur sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              onClick={() => setResetOpen(true)}
              className="sm:shrink-0"
            >
              <RotateCcw size={16} /> Reset
            </Button>

            <div className="min-h-5 flex-1 text-center sm:text-left">
              {editor.dirty && !editor.saving && !editor.saveError && !editor.saved && (
                <p className="text-xs font-semibold text-amber-700">Unsaved appearance changes</p>
              )}
              {editor.saved && (
                <p className="text-xs font-semibold text-emerald-700">Changes saved.</p>
              )}
              {editor.saveError && (
                <p className="text-xs font-semibold text-red-700">{editor.saveError}</p>
              )}
            </div>

            <Button
              variant="primary"
              onClick={() => void editor.saveChanges()}
              disabled={editor.saving || !editor.dirty}
              className="sm:min-w-36 sm:shrink-0"
            >
              <Save size={16} />
              {editor.saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      <ProfilePreviewFrame
        profile={editor.profile}
        visitor={mockVisitor}
        badge={editor.layoutMode === "visual" ? "Visual" : "Classic"}
        subtitle="Appearance updates instantly"
      />

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
