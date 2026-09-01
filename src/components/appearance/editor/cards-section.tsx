import { SlidersHorizontal } from "lucide-react";
import ColorPicker from "@/components/ui/color-picker";
import { RangeField, SegmentedControl, SelectField } from "@/components/ui/editor-controls";
import { AppearanceSection } from "./appearance-section";
import type { CardAppearance, CardHoverEffect, LinkCardLayout, LinkImageFit, LinkTitlePosition } from "@/types/profile";

export default function CardsSection({ cards, onChange }: {
  cards: CardAppearance;
  onChange: (values: Partial<CardAppearance>) => void;
}) {
  return (
    <AppearanceSection icon={SlidersHorizontal} title="Cards" description="Global styling for visual link cards.">
      <div className="space-y-5">
        <SelectField label="Default card layout" value={cards.defaultLayout} onChange={(value) => onChange({ defaultLayout: value as LinkCardLayout })} options={[{ value: "button", label: "Button" }, { value: "compact", label: "Compact" }, { value: "half", label: "Half" }, { value: "full", label: "Full" }, { value: "featured", label: "Featured" }]} />
        <RangeField label="Card radius" value={cards.borderRadius} min={0} max={40} step={1} suffix="px" onChange={(borderRadius) => onChange({ borderRadius })} />
        <RangeField label="Card spacing" value={cards.spacing} min={4} max={32} step={1} suffix="px" onChange={(spacing) => onChange({ spacing })} />
        <RangeField label="Standard card height" value={cards.cardHeight} min={140} max={400} step={10} suffix="px" onChange={(cardHeight) => onChange({ cardHeight })} />
        <RangeField label="Featured card height" value={cards.featuredHeight} min={220} max={600} step={10} suffix="px" onChange={(featuredHeight) => onChange({ featuredHeight })} />
        <SegmentedControl label="Image fit" value={cards.imageFit} options={[{ value: "cover", label: "Cover" }, { value: "contain", label: "Contain" }]} onChange={(value) => onChange({ imageFit: value as LinkImageFit })} />
        <ColorPicker label="Overlay color" value={cards.overlayColor} onChange={(overlayColor) => onChange({ overlayColor })} />
        <RangeField label="Default overlay" value={Math.round(cards.overlayOpacity * 100)} min={0} max={85} step={5} suffix="%" onChange={(value) => onChange({ overlayOpacity: value / 100 })} />
        <SelectField label="Default title position" value={cards.titlePosition} onChange={(value) => onChange({ titlePosition: value as LinkTitlePosition })} options={[{ value: "bottom-left", label: "Bottom left" }, { value: "bottom-center", label: "Bottom center" }, { value: "center", label: "Center" }]} />
        <RangeField label="Title size" value={cards.titleSize} min={12} max={36} step={1} suffix="px" onChange={(titleSize) => onChange({ titleSize })} />
        <RangeField label="Border width" value={cards.borderWidth} min={0} max={4} step={1} suffix="px" onChange={(borderWidth) => onChange({ borderWidth })} />
        <RangeField label="Shadow" value={cards.shadow} min={0} max={4} step={1} onChange={(shadow) => onChange({ shadow })} />
        <SelectField label="Hover effect" value={cards.hoverEffect} onChange={(value) => onChange({ hoverEffect: value as CardHoverEffect })} options={[{ value: "none", label: "None" }, { value: "lift", label: "Lift" }, { value: "scale", label: "Scale" }, { value: "glow", label: "Glow" }]} />
      </div>
    </AppearanceSection>
  );
}
