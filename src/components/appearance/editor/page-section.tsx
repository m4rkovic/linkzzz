import { Palette } from "lucide-react";
import ColorPicker from "@/components/ui/color-picker";
import { RangeField, SegmentedControl } from "@/components/ui/editor-controls";
import { AppearanceSection } from "./appearance-section";
import type { BackgroundType, PageAppearance, ProfileAppearance } from "@/types/profile";

export default function PageSection({ appearance, page, onAppearanceChange, onPageChange }: {
  appearance: ProfileAppearance;
  page: PageAppearance;
  onAppearanceChange: (values: Partial<ProfileAppearance>) => void;
  onPageChange: (values: Partial<PageAppearance>) => void;
}) {
  return (
    <AppearanceSection icon={Palette} title="Page" description="Background, colors and overall page dimensions.">
      <div className="space-y-5">
        <SegmentedControl label="Background" value={appearance.backgroundType} options={[{ value: "solid", label: "Solid" }, { value: "gradient", label: "Gradient" }]} onChange={(value) => onAppearanceChange({ backgroundType: value as BackgroundType })} />
        {appearance.backgroundType === "solid" ? (
          <ColorPicker label="Background color" value={appearance.backgroundColor} onChange={(value) => onAppearanceChange({ backgroundColor: value })} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorPicker label="Gradient start" value={appearance.gradientFrom} onChange={(value) => onAppearanceChange({ gradientFrom: value })} />
            <ColorPicker label="Gradient end" value={appearance.gradientTo} onChange={(value) => onAppearanceChange({ gradientTo: value })} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorPicker label="Primary text" value={appearance.primaryTextColor} onChange={(value) => onAppearanceChange({ primaryTextColor: value })} />
          <ColorPicker label="Secondary text" value={appearance.secondaryTextColor} onChange={(value) => onAppearanceChange({ secondaryTextColor: value })} />
        </div>
        <RangeField label="Page width" value={page.maxWidth} min={480} max={1000} step={20} suffix="px" onChange={(value) => onPageChange({ maxWidth: value })} />
        <RangeField label="Horizontal padding" value={page.horizontalPadding} min={8} max={40} step={2} suffix="px" onChange={(value) => onPageChange({ horizontalPadding: value })} />
        <RangeField label="Section spacing" value={page.sectionSpacing} min={8} max={48} step={2} suffix="px" onChange={(value) => onPageChange({ sectionSpacing: value })} />
      </div>
    </AppearanceSection>
  );
}
