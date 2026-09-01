import { SlidersHorizontal } from "lucide-react";
import ColorPicker from "@/components/ui/color-picker";
import { RangeField, SegmentedControl } from "@/components/ui/editor-controls";
import { AppearanceSection } from "./appearance-section";
import type { ButtonStyle, ProfileAppearance } from "@/types/profile";

export default function ClassicButtonsSection({ appearance, onChange }: {
  appearance: ProfileAppearance;
  onChange: (values: Partial<ProfileAppearance>) => void;
}) {
  return (
    <AppearanceSection icon={SlidersHorizontal} title="Classic buttons" description="Customize the original Linkzzz button layout.">
      <div className="space-y-5">
        <SegmentedControl label="Button style" value={appearance.buttonStyle} options={[{ value: "filled", label: "Filled" }, { value: "outline", label: "Outline" }, { value: "glass", label: "Glass" }]} onChange={(value) => onChange({ buttonStyle: value as ButtonStyle })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorPicker label="Button background" value={appearance.buttonBackgroundColor} onChange={(value) => onChange({ buttonBackgroundColor: value })} />
          <ColorPicker label="Button text" value={appearance.buttonTextColor} onChange={(value) => onChange({ buttonTextColor: value })} />
          <ColorPicker label="Button border" value={appearance.buttonBorderColor} onChange={(value) => onChange({ buttonBorderColor: value })} />
        </div>
        <RangeField label="Corner radius" value={appearance.borderRadius} min={0} max={32} step={1} suffix="px" onChange={(value) => onChange({ borderRadius: value })} />
        <RangeField label="Button spacing" value={appearance.buttonSpacing} min={4} max={32} step={1} suffix="px" onChange={(value) => onChange({ buttonSpacing: value })} />
        <RangeField label="Shadow" value={appearance.shadow} min={0} max={4} step={1} onChange={(value) => onChange({ shadow: value })} />
      </div>
    </AppearanceSection>
  );
}
