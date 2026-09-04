import { SlidersHorizontal } from "lucide-react";
import { DestinationPicker } from "@/components/destinations/destination-picker";
import { Field, INPUT_CLASS as inputClass } from "@/components/ui/editor-controls";
import type { LinkCardAspectRatio } from "@/types/profile";
import type { LinkDraft } from "@/features/links/link-editor-types";
import { LINK_LAYOUT_OPTIONS } from "@/features/links/link-config";
import { platformToProviderId, providerToPlatformId } from "@/config/platforms";
import { AspectRatioButton, CardLayoutIcon, EditorSection } from "./link-editor-primitives";

type Props = { draft: LinkDraft; onChange: (values: Partial<LinkDraft>) => void };

export default function LinkBasicSections({ draft, onChange }: Props) {
  const aspectRatios: { value: LinkCardAspectRatio; label: string }[] = [
    { value: "auto", label: "Auto" },
    { value: "square", label: "Square" },
    { value: "landscape", label: "Landscape" },
    { value: "portrait", label: "Portrait" },
    { value: "wide", label: "Wide" },
  ];

  return (
    <>
      <EditorSection title="Content" description="Basic information and destination for the card.">
        <div className="grid gap-4">
          <Field label="Title" htmlFor="link-title"><input id="link-title" type="text" value={draft.title} maxLength={80} onChange={(event) => onChange({ title: event.target.value })} placeholder="Listen on Spotify" className={inputClass} /></Field>
          <Field label="Description" htmlFor="link-description" optional><input id="link-description" type="text" value={draft.description} maxLength={120} onChange={(event) => onChange({ description: event.target.value })} placeholder="New single out now" className={inputClass} /></Field>
        </div>

        <div className="mt-5">
          <DestinationPicker
            title="Card destination"
            showFallback={false}
            showLabel={false}
            value={{
              provider: platformToProviderId(draft.platform),
              value: draft.url,
              url: draft.url,
            }}
            onChange={(destination) => onChange({
              url: destination.url,
              platform: providerToPlatformId(destination.provider),
            })}
          />
        </div>
      </EditorSection>

      <EditorSection title="Card layout" description="Choose the size and structure of this link.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LINK_LAYOUT_OPTIONS.map((option) => {
            const selected = draft.layout === option.id;
            return (
              <button key={option.id} type="button" onClick={() => onChange({ layout: option.id })} className={`min-h-[92px] rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20 ${selected ? "border-brand-violet-strong bg-brand-violet-strong text-white shadow-sm" : "border-zinc-200 bg-white text-zinc-900 hover:border-brand-violet/50 hover:bg-brand-violet-soft/40"}`}>
                <CardLayoutIcon layout={option.id} selected={selected} />
                <p className="mt-2 text-xs font-bold">{option.name}</p>
                <p className={`mt-1 text-[10px] leading-4 ${selected ? "text-white/65" : "text-zinc-400"}`}>{option.description}</p>
              </button>
            );
          })}
        </div>
      </EditorSection>

      {draft.layout !== "button" && (
        <EditorSection title="Tile shape" description="Choose the proportions of this visual card." icon={SlidersHorizontal}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {aspectRatios.map((option) => <AspectRatioButton key={option.value} label={option.label} ratio={option.value} selected={draft.aspectRatio === option.value} onClick={() => onChange({ aspectRatio: option.value })} />)}
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-400">Auto uses the global or custom card height. Other options preserve a fixed aspect ratio.</p>
        </EditorSection>
      )}
    </>
  );
}
