import { Type } from "lucide-react";
import { RangeField, SegmentedControl, ToggleRow } from "@/components/ui/editor-controls";
import { AppearanceSection } from "./appearance-section";
import type { AvatarShape, IdentityAppearance, ProfileTextAlignment, SocialIconStyle } from "@/types/profile";

export default function IdentitySection({ identity, onChange }: {
  identity: IdentityAppearance;
  onChange: (values: Partial<IdentityAppearance>) => void;
}) {
  return (
    <AppearanceSection icon={Type} title="Profile identity" description="Customize avatar, name and social presentation.">
      <div className="space-y-5">
        <SegmentedControl label="Alignment" value={identity.alignment} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }]} onChange={(value) => onChange({ alignment: value as ProfileTextAlignment })} />
        <SegmentedControl label="Avatar shape" value={identity.avatarShape} options={[{ value: "circle", label: "Circle" }, { value: "rounded", label: "Rounded" }, { value: "square", label: "Square" }]} onChange={(value) => onChange({ avatarShape: value as AvatarShape })} />
        <RangeField label="Avatar size" value={identity.avatarSize} min={48} max={160} step={4} suffix="px" onChange={(avatarSize) => onChange({ avatarSize })} />
        <RangeField label="Name size" value={identity.nameSize} min={18} max={48} step={1} suffix="px" onChange={(nameSize) => onChange({ nameSize })} />
        <RangeField label="Bio width" value={identity.bioMaxWidth} min={240} max={700} step={20} suffix="px" onChange={(bioMaxWidth) => onChange({ bioMaxWidth })} />
        <SegmentedControl label="Social icon style" value={identity.socialIconStyle} options={[{ value: "plain", label: "Plain" }, { value: "circle", label: "Circle" }, { value: "square", label: "Square" }]} onChange={(value) => onChange({ socialIconStyle: value as SocialIconStyle })} />
        <RangeField label="Social icon size" value={identity.socialIconSize} min={14} max={34} step={1} suffix="px" onChange={(socialIconSize) => onChange({ socialIconSize })} />
        <ToggleRow label="Location" description="Show the profile location." checked={identity.showLocation} onChange={(showLocation) => onChange({ showLocation })} />
        <ToggleRow label="Profile stats" description="Show custom audience or profile statistics." checked={identity.showStats} onChange={(showStats) => onChange({ showStats })} />
      </div>
    </AppearanceSection>
  );
}
