import { RangeField, SelectField, ToggleRow } from "@/components/ui/editor-controls";
import type { LinkTitlePosition } from "@/types/profile";
import type { LinkDraft } from "@/features/links/link-editor-types";
import { EditorSection } from "./link-editor-primitives";

export default function LinkDisplaySection({ draft, onChange }: { draft: LinkDraft; onChange: (values: Partial<LinkDraft>) => void }) {
  return (
    <EditorSection title="Display" description="Choose which content appears on the card.">
      <div className="space-y-2">
        <ToggleRow label="Platform icon" description="Show the selected network icon." checked={draft.showPlatformIcon} onChange={(showPlatformIcon) => onChange({ showPlatformIcon })} />
        <ToggleRow label="Title" description="Display the card title." checked={draft.showTitle} onChange={(showTitle) => onChange({ showTitle })} />
        <ToggleRow label="Description" description="Display secondary text." checked={draft.showDescription} onChange={(showDescription) => onChange({ showDescription })} />
        {draft.layout !== "button" && (
          <>
            <ToggleRow label="Image overlay" description="Darken the card image for readable text." checked={draft.overlayEnabled} onChange={(overlayEnabled) => onChange({ overlayEnabled })} />
            {draft.overlayEnabled && !draft.customStyle.enabled && <RangeField label="Overlay strength" value={Math.round(draft.overlayOpacity * 100)} min={0} max={85} step={5} suffix="%" onChange={(value) => onChange({ overlayOpacity: value / 100 })} />}
            <SelectField label="Title position" value={draft.titlePosition} options={[{ value: "bottom-left", label: "Bottom left" }, { value: "bottom-center", label: "Bottom center" }, { value: "center", label: "Center" }]} onChange={(value) => onChange({ titlePosition: value as LinkTitlePosition })} />
          </>
        )}
      </div>
    </EditorSection>
  );
}
