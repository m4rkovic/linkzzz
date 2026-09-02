import { Type } from "lucide-react";
import { RangeField, SelectField } from "@/components/ui/editor-controls";
import { AppearanceSection } from "./appearance-section";
import { APPEARANCE_FONTS, getFontName } from "@/features/profile/appearance-presets";
import type { ProfileAppearance } from "@/types/profile";

export default function TypographySection({ appearance, onChange }: {
  appearance: ProfileAppearance;
  onChange: (values: Partial<ProfileAppearance>) => void;
}) {
  return (
    <AppearanceSection icon={Type} title="Typography" description="Font family and global heading character.">
      <div className="space-y-4">
        <SelectField
          label="Font family"
          value={appearance.fontFamily}
          onChange={(fontFamily) => onChange({ fontFamily })}
          options={APPEARANCE_FONTS.map((font) => ({ value: font, label: getFontName(font) }))}
        />
        <SelectField
          label="Heading weight"
          value={String(appearance.headingWeight ?? 900)}
          onChange={(value) => onChange({ headingWeight: Number(value) as 600 | 700 | 800 | 900 })}
          options={[
            { value: "600", label: "Semibold" },
            { value: "700", label: "Bold" },
            { value: "800", label: "Extra bold" },
            { value: "900", label: "Black" },
          ]}
        />
        <RangeField
          label="Heading letter spacing"
          value={Math.round((appearance.headingLetterSpacing ?? -0.025) * 1000)}
          min={-60}
          max={40}
          step={5}
          suffix="/1000em"
          onChange={(value) => onChange({ headingLetterSpacing: value / 1000 })}
        />
      </div>
    </AppearanceSection>
  );
}
