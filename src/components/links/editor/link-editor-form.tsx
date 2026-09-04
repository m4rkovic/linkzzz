import { useState, type Dispatch, type SetStateAction } from "react";
import {
  CalendarClock,
  Globe2,
  ImagePlus,
  Link2,
  Palette,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import GeoRoutingEditor from "@/components/links/geo-routing-editor";
import type { CardStyleDraft, LinkDraft } from "@/features/links/link-editor-types";
import { EditorSection } from "./link-editor-primitives";
import LinkBasicSections from "./link-basic-sections";
import LinkMediaSection from "./link-media-section";
import LinkDisplaySection from "./link-display-section";
import LinkCardDesignSection from "./link-card-design-section";
import LinkAvailabilitySection from "./link-availability-section";
import LinkSensitiveContentSection from "./link-sensitive-content-section";

type LinkEditorPanel = "basics" | "media" | "design" | "rules" | "geo";

const panels = [
  { id: "basics", label: "Basics", icon: Link2 },
  { id: "media", label: "Media", icon: ImagePlus },
  { id: "design", label: "Design", icon: Palette },
  { id: "rules", label: "Rules", icon: CalendarClock },
  { id: "geo", label: "Geo", icon: Globe2 },
] as const;

export default function LinkEditorForm({ draft, setDraft, error, onSave, onCancel, protectedImageUrl }: {
  draft: LinkDraft;
  setDraft: Dispatch<SetStateAction<LinkDraft>>;
  error: string;
  onSave: () => void;
  onCancel: () => void;
  protectedImageUrl?: string;
}) {
  const [activePanel, setActivePanel] = useState<LinkEditorPanel>("basics");

  function updateDraft(values: Partial<LinkDraft>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function updateCustomStyle(values: Partial<CardStyleDraft>) {
    setDraft((current) => ({
      ...current,
      customStyle: { ...current.customStyle, ...values },
    }));
  }

  return (
    <div className="space-y-5">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[154px_minmax(0,1fr)]">
        <nav
          aria-label="Card settings"
          className="min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-2 lg:sticky lg:top-24 lg:self-start"
        >
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {panels.map((panel) => {
              const Icon = panel.icon;
              const selected = panel.id === activePanel;

              return (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => setActivePanel(panel.id)}
                  aria-current={selected ? "page" : undefined}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/25 lg:flex lg:w-full lg:justify-start ${
                    selected
                      ? "bg-brand-violet-strong text-white shadow-sm"
                      : "text-zinc-600 hover:bg-white hover:text-zinc-950"
                  }`}
                >
                  <Icon size={15} aria-hidden="true" />
                  {panel.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-violet-strong">
                Card editor
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Edit one group at a time instead of scrolling through the whole card setup.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-lime-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-800">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-lime-strong" />
              Live preview
            </span>
          </div>

          {activePanel === "basics" && (
            <div className="space-y-7">
              <LinkBasicSections draft={draft} onChange={updateDraft} />
            </div>
          )}

          {activePanel === "media" && (
            <LinkMediaSection draft={draft} onChange={updateDraft} protectedImageUrl={protectedImageUrl} />
          )}

          {activePanel === "design" && (
            <div className="space-y-7">
              <LinkDisplaySection draft={draft} onChange={updateDraft} />
              <LinkCardDesignSection draft={draft} onChange={updateCustomStyle} />
            </div>
          )}

          {activePanel === "rules" && (
            <div className="space-y-7">
              <LinkAvailabilitySection draft={draft} onChange={updateDraft} />
              <LinkSensitiveContentSection draft={draft} onChange={updateDraft} />
            </div>
          )}

          {activePanel === "geo" && (
            <EditorSection
              title="Geo routing"
              description="Control this card by visitor country without changing the page-wide Geo rules."
              icon={Globe2}
            >
              <GeoRoutingEditor geo={draft.geo} onChange={(geo) => updateDraft({ geo })} />
            </EditorSection>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={onSave}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-lime px-4 text-sm font-black text-zinc-950 transition hover:bg-brand-lime-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-lime/30"
        >
          <Save size={16} /> Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-violet-soft px-4 text-sm font-bold text-brand-violet-strong transition hover:bg-brand-violet/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20"
        >
          <X size={16} /> Cancel
        </button>
      </div>
    </div>
  );
}
