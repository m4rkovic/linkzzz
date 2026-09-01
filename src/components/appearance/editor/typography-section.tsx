import { Type } from "lucide-react";
import { SelectField } from "@/components/ui/editor-controls";
import { AppearanceSection } from "./appearance-section";
import { APPEARANCE_FONTS, getFontName } from "@/features/profile/appearance-presets";

export default function TypographySection({ fontFamily, onChange }: { fontFamily: string; onChange: (fontFamily: string) => void }) {
  return (
    <AppearanceSection icon={Type} title="Typography" description="Choose the profile font and text hierarchy.">
      <SelectField label="Font family" value={fontFamily} onChange={onChange} options={APPEARANCE_FONTS.map((font) => ({ value: font, label: getFontName(font) }))} />
    </AppearanceSection>
  );
}
