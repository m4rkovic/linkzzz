import type { ChangeEventHandler } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import ColorPicker from "@/components/ui/color-picker";
import { RangeField, SegmentedControl, SelectField, ToggleRow } from "@/components/ui/editor-controls";
import UserContentImage from "@/components/ui/user-content-image";
import { AppearanceSection } from "./appearance-section";
import type { HeroAppearance, HeroContentPosition, LinkImageFit, LinkImagePosition, PublicProfileData } from "@/types/profile";

export default function HeroSection({ profile, hero, onChange, onCoverUpload, onRemoveCover }: {
  profile: PublicProfileData;
  hero: HeroAppearance;
  onChange: (values: Partial<HeroAppearance>) => void;
  onCoverUpload: ChangeEventHandler<HTMLInputElement>;
  onRemoveCover: () => void;
}) {
  return (
    <AppearanceSection icon={ImagePlus} title="Hero" description="Create a large visual introduction at the top of the profile.">
      <div className="space-y-5">
        <ToggleRow label="Enable hero" description="Show a cover area above the profile." checked={hero.enabled} onChange={(enabled) => onChange({ enabled })} />
        {hero.enabled && (
          <>
            {profile.coverImageUrl ? (
              <div className="overflow-hidden rounded-2xl border border-zinc-200">
                <div className="relative aspect-[16/7] bg-zinc-100">
                  <UserContentImage src={profile.coverImageUrl} alt="" className="h-full w-full" style={{ objectFit: hero.imageFit, objectPosition: getObjectPosition(hero.imagePosition ?? "center") }} />
                  <button type="button" onClick={onRemoveCover} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black" aria-label="Remove cover"><Trash2 size={16} /></button>
                </div>
              </div>
            ) : (
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 text-center transition hover:border-zinc-400 hover:bg-zinc-100">
                <ImagePlus size={22} className="text-zinc-400" />
                <span className="mt-3 text-sm font-semibold text-zinc-800">Upload cover image</span>
                <span className="mt-1 text-xs text-zinc-400">JPG, PNG or WEBP</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onCoverUpload} className="hidden" />
              </label>
            )}

            <RangeField label="Hero height" value={hero.height} min={180} max={520} step={10} suffix="px" onChange={(height) => onChange({ height })} />
            <SegmentedControl
              label="Hero content"
              value={hero.contentPosition}
              options={[{ value: "bottom-left", label: "Left" }, { value: "bottom-center", label: "Center" }, { value: "below", label: "Below" }]}
              onChange={(value) => {
                const contentPosition = value as HeroContentPosition;
                onChange({ contentPosition, profilePosition: contentPosition === "below" ? "below-hero" : "over-hero" });
              }}
            />
            <ToggleRow label="Full bleed hero" description="Let the cover image reach the edges of the profile." checked={hero.fullBleed} onChange={(fullBleed) => onChange({ fullBleed })} />
            {hero.contentPosition === "below" && <RangeField label="Avatar overlap" value={hero.avatarOverlap} min={0} max={100} step={2} suffix="px" onChange={(avatarOverlap) => onChange({ avatarOverlap })} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Image fit" value={hero.imageFit} options={[{ value: "cover", label: "Cover" }, { value: "contain", label: "Contain" }]} onChange={(value) => onChange({ imageFit: value as LinkImageFit })} />
              <SelectField label="Cover position" value={hero.imagePosition ?? "center"} options={[{ value: "center", label: "Center" }, { value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }]} onChange={(value) => onChange({ imagePosition: value as LinkImagePosition })} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorPicker label="Hero text" value={hero.heroTextColor} onChange={(heroTextColor) => onChange({ heroTextColor })} />
              <ColorPicker label="Hero secondary text" value={hero.heroSecondaryTextColor} onChange={(heroSecondaryTextColor) => onChange({ heroSecondaryTextColor })} />
            </div>

            <div className="space-y-2">
              <ToggleRow label="Avatar" description="Show profile image in the hero." checked={hero.showAvatar} onChange={(showAvatar) => onChange({ showAvatar })} />
              <ToggleRow label="Name" description="Show display name." checked={hero.showName} onChange={(showName) => onChange({ showName })} />
              <ToggleRow label="Username" description="Show @username." checked={hero.showUsername} onChange={(showUsername) => onChange({ showUsername })} />
              <ToggleRow label="Bio" description="Show the profile bio." checked={hero.showBio} onChange={(showBio) => onChange({ showBio })} />
              <ToggleRow label="Social icons" description="Show social networks in the hero." checked={hero.showSocials} onChange={(showSocials) => onChange({ showSocials })} />
              <ToggleRow label="Location" description="Show profile location." checked={hero.showLocation} onChange={(showLocation) => onChange({ showLocation })} />
              <ToggleRow label="Stats" description="Show profile stats near the hero." checked={hero.showStats} onChange={(showStats) => onChange({ showStats })} />
            </div>

            <ToggleRow label="Hero overlay" description="Darken the cover image for better readability." checked={hero.overlayEnabled} onChange={(overlayEnabled) => onChange({ overlayEnabled })} />
            {hero.overlayEnabled && (
              <>
                <ColorPicker label="Overlay color" value={hero.overlayColor} onChange={(overlayColor) => onChange({ overlayColor })} />
                <RangeField label="Overlay opacity" value={Math.round(hero.overlayOpacity * 100)} min={0} max={85} step={5} suffix="%" onChange={(value) => onChange({ overlayOpacity: value / 100 })} />
              </>
            )}
          </>
        )}
      </div>
    </AppearanceSection>
  );
}

function getObjectPosition(position: LinkImagePosition) {
  if (position === "top") return "center top";
  if (position === "bottom") return "center bottom";
  if (position === "left") return "left center";
  if (position === "right") return "right center";
  return "center center";
}
