import { SlidersHorizontal } from "lucide-react";
import { Field, INPUT_CLASS as inputClass } from "@/components/ui/editor-controls";
import type { LinkCardAspectRatio, PlatformId } from "@/types/profile";
import type { LinkDraft } from "@/features/links/link-editor-types";
import { LINK_LAYOUT_OPTIONS } from "@/features/links/link-config";
import { PlatformIcon, PLATFORMS } from "@/config/platforms";
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
      <EditorSection title="Content" description="Basic information for the link.">
        <div className="grid gap-4">
          <Field label="Title" htmlFor="link-title"><input id="link-title" type="text" value={draft.title} maxLength={80} onChange={(event) => onChange({ title: event.target.value })} placeholder="My Telegram" className={inputClass} /></Field>
          <Field label="Description" htmlFor="link-description" optional><input id="link-description" type="text" value={draft.description} maxLength={120} onChange={(event) => onChange({ description: event.target.value })} placeholder="Join the community" className={inputClass} /></Field>
          <Field label="Default URL" htmlFor="link-default-url">
            <input id="link-default-url" type="text" value={draft.url} onChange={(event) => onChange({ url: event.target.value })} placeholder="https://..." className={inputClass} />
            <p className="mt-1.5 text-xs leading-5 text-zinc-400">Used when no country-specific Geo Route exists.</p>
          </Field>
        </div>
      </EditorSection>

      <EditorSection title="Platform" description="Choose which service this link represents.">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white"><PlatformIcon platform={draft.platform} size={18} /></div>
          <select value={draft.platform} onChange={(event) => onChange({ platform: event.target.value as PlatformId })} className={inputClass}>
            {PLATFORMS.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
          </select>
        </div>
      </EditorSection>

      <EditorSection title="Card layout" description="Choose the size and structure of this link.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LINK_LAYOUT_OPTIONS.map((option) => {
            const selected = draft.layout === option.id;
            return (
              <button key={option.id} type="button" onClick={() => onChange({ layout: option.id })} className={`min-h-[92px] rounded-xl border p-3 text-left transition ${selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"}`}>
                <CardLayoutIcon layout={option.id} selected={selected} />
                <p className="mt-2 text-xs font-bold">{option.name}</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400">{option.description}</p>
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
