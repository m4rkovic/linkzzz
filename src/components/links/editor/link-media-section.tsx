import type { ChangeEvent } from "react";
import { ImageOff, ImagePlus, Trash2 } from "lucide-react";
import { Field, INPUT_CLASS as inputClass, SelectField } from "@/components/ui/editor-controls";
import UserContentImage from "@/components/ui/user-content-image";
import type { LinkImageFit, LinkImagePosition } from "@/types/profile";
import type { LinkDraft } from "@/features/links/link-editor-types";
import { revokeDraftBlobIfDisposable } from "@/features/links/link-editor-model";
import { EditorSection } from "./link-editor-primitives";

export default function LinkMediaSection({ draft, onChange, protectedImageUrl }: {
  draft: LinkDraft;
  onChange: (values: Partial<LinkDraft>) => void;
  protectedImageUrl?: string;
}) {
  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const newUrl = URL.createObjectURL(file);
    revokeDraftBlobIfDisposable(draft.imageUrl, protectedImageUrl);
    onChange({ imageUrl: newUrl, imageAlt: draft.imageAlt || draft.title });
    event.target.value = "";
  }

  function removeImage() {
    revokeDraftBlobIfDisposable(draft.imageUrl, protectedImageUrl);
    onChange({ imageUrl: "", imageAlt: "" });
  }

  return (
    <EditorSection title="Media" description="Choose the image used by this tile.">
      {draft.imageUrl ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <div className="relative aspect-[16/9] bg-zinc-100">
            <UserContentImage src={draft.imageUrl} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={removeImage} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black" aria-label="Remove image"><Trash2 size={16} /></button>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <SelectField label="Image fit" value={draft.imageFit} options={[{ value: "cover", label: "Cover" }, { value: "contain", label: "Contain" }]} onChange={(value) => onChange({ imageFit: value as LinkImageFit })} />
            <SelectField label="Image position" value={draft.imagePosition} options={[{ value: "center", label: "Center" }, { value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }]} onChange={(value) => onChange({ imagePosition: value as LinkImagePosition })} />
            <div className="sm:col-span-2"><Field label="Alt text" htmlFor="link-image-alt" optional><input id="link-image-alt" type="text" value={draft.imageAlt} onChange={(event) => onChange({ imageAlt: event.target.value })} className={inputClass} /></Field></div>
          </div>
        </div>
      ) : (
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 text-center transition hover:border-zinc-400 hover:bg-zinc-100">
          <ImagePlus size={22} className="text-zinc-400" />
          <span className="mt-3 text-sm font-semibold text-zinc-800">Upload card image</span>
          <span className="mt-1 text-xs text-zinc-400">JPG, PNG or WEBP</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
        </label>
      )}
      {draft.layout === "button" && <div className="mt-3 flex items-start gap-2 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-500"><ImageOff size={15} className="mt-0.5 shrink-0" />Button layout does not show the visual tile image.</div>}
      <p className="mt-3 text-[11px] leading-5 text-zinc-400">The image is uploaded securely when you save your links.</p>
    </EditorSection>
  );
}
