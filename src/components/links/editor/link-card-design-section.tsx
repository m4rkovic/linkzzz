import { Palette } from "lucide-react";
import ColorPicker from "@/components/ui/color-picker";
import { RangeField, SegmentedControl, ToggleRow } from "@/components/ui/editor-controls";
import type { LinkCardBackgroundType, LinkPlatformBadgePosition, LinkPlatformBadgeStyle } from "@/types/profile";
import type { CardStyleDraft, LinkDraft } from "@/features/links/link-editor-types";
import { EditorSection } from "./link-editor-primitives";

export default function LinkCardDesignSection({ draft, onChange }: {
  draft: LinkDraft;
  onChange: (values: Partial<CardStyleDraft>) => void;
}) {
  if (draft.layout === "button") return null;
  const style = draft.customStyle;

  return (
    <EditorSection title="Card design" description="Override the global Appearance settings for this card." icon={Palette}>
      <div className="space-y-5">
        <ToggleRow label="Custom styling" description="Give this card its own colors, shape and badge style." checked={style.enabled} onChange={(enabled) => onChange({ enabled })} />
        {!style.enabled && <div className="rounded-xl bg-zinc-50 p-4 text-xs leading-5 text-zinc-500">This card currently inherits its design from Appearance → Cards.</div>}
        {style.enabled && (
          <>
            <SegmentedControl label="Background" value={style.backgroundType} options={[{ value: "image", label: "Image" }, { value: "solid", label: "Solid" }, { value: "gradient", label: "Gradient" }]} onChange={(value) => onChange({ backgroundType: value as LinkCardBackgroundType })} />
            {style.backgroundType === "image" && <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-5 text-zinc-500">The image from the Media section is used as the card background.</div>}
            {style.backgroundType === "solid" && <ColorPicker label="Background color" value={style.backgroundColor} onChange={(backgroundColor) => onChange({ backgroundColor })} />}
            {style.backgroundType === "gradient" && <div className="grid gap-4 sm:grid-cols-2"><ColorPicker label="Gradient start" value={style.gradientFrom} onChange={(gradientFrom) => onChange({ gradientFrom })} /><ColorPicker label="Gradient end" value={style.gradientTo} onChange={(gradientTo) => onChange({ gradientTo })} /></div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorPicker label="Text color" value={style.textColor} onChange={(textColor) => onChange({ textColor })} />
              <ColorPicker label="Border color" value={style.borderColor} onChange={(borderColor) => onChange({ borderColor })} />
            </div>
            <RangeField label="Card height" value={style.height} min={120} max={600} step={10} suffix="px" onChange={(height) => onChange({ height })} />
            <RangeField label="Corner radius" value={style.borderRadius} min={0} max={48} step={1} suffix="px" onChange={(borderRadius) => onChange({ borderRadius })} />
            <RangeField label="Border width" value={style.borderWidth} min={0} max={5} step={1} suffix="px" onChange={(borderWidth) => onChange({ borderWidth })} />
            <RangeField label="Shadow" value={style.shadow} min={0} max={4} step={1} onChange={(shadow) => onChange({ shadow })} />

            {draft.overlayEnabled && (
              <>
                <ColorPicker label="Overlay color" value={style.overlayColor} onChange={(overlayColor) => onChange({ overlayColor })} />
                <RangeField label="Overlay opacity" value={Math.round(style.overlayOpacity * 100)} min={0} max={90} step={5} suffix="%" onChange={(value) => onChange({ overlayOpacity: value / 100 })} />
              </>
            )}

            {draft.showPlatformIcon && (
              <div className="space-y-5">
                <SegmentedControl label="Platform badge" value={style.platformBadgeStyle} options={[{ value: "circle", label: "Circle" }, { value: "plain", label: "Plain" }, { value: "none", label: "None" }]} onChange={(value) => onChange({ platformBadgeStyle: value as LinkPlatformBadgeStyle })} />
                {style.platformBadgeStyle !== "none" && (
                  <>
                    <SegmentedControl label="Badge position" value={style.platformBadgePosition} options={[{ value: "top-left", label: "Top left" }, { value: "top-right", label: "Top right" }]} onChange={(value) => onChange({ platformBadgePosition: value as LinkPlatformBadgePosition })} />
                    {style.platformBadgeStyle === "circle" && <div className="grid gap-4 sm:grid-cols-2"><ColorPicker label="Badge background" value={style.platformBadgeBackgroundColor} onChange={(platformBadgeBackgroundColor) => onChange({ platformBadgeBackgroundColor })} /><ColorPicker label="Badge icon" value={style.platformBadgeTextColor} onChange={(platformBadgeTextColor) => onChange({ platformBadgeTextColor })} /></div>}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </EditorSection>
  );
}
