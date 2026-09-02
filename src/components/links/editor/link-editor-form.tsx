import type { Dispatch, SetStateAction } from "react";
import { Globe2, Save, X } from "lucide-react";
import GeoRoutingEditor from "@/components/links/geo-routing-editor";
import type { CardStyleDraft, LinkDraft } from "@/features/links/link-editor-types";
import { EditorSection } from "./link-editor-primitives";
import LinkBasicSections from "./link-basic-sections";
import LinkMediaSection from "./link-media-section";
import LinkDisplaySection from "./link-display-section";
import LinkCardDesignSection from "./link-card-design-section";
import LinkAvailabilitySection from "./link-availability-section";
import LinkSensitiveContentSection from "./link-sensitive-content-section";

export default function LinkEditorForm({ draft, setDraft, error, onSave, onCancel, protectedImageUrl }: {
  draft: LinkDraft;
  setDraft: Dispatch<SetStateAction<LinkDraft>>;
  error: string;
  onSave: () => void;
  onCancel: () => void;
  protectedImageUrl?: string;
}) {
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
    <div className="space-y-8">
      <LinkBasicSections draft={draft} onChange={updateDraft} />
      <LinkMediaSection draft={draft} onChange={updateDraft} protectedImageUrl={protectedImageUrl} />
      <LinkDisplaySection draft={draft} onChange={updateDraft} />
      <LinkCardDesignSection draft={draft} onChange={updateCustomStyle} />
      <LinkAvailabilitySection draft={draft} onChange={updateDraft} />
      <LinkSensitiveContentSection draft={draft} onChange={updateDraft} />

      <EditorSection title="Geo routing" description="Control this card by visitor country without changing the page-wide Geo rules." icon={Globe2}>
        <GeoRoutingEditor geo={draft.geo} onChange={(geo) => updateDraft({ geo })} />
      </EditorSection>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-5">
        <button type="button" onClick={onSave} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"><Save size={16} />Save</button>
        <button type="button" onClick={onCancel} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"><X size={16} />Cancel</button>
      </div>
    </div>
  );
}
