import type { ReactNode } from "react";

import UserContentImage from "@/components/ui/user-content-image";
import { getObjectPosition } from "@/components/public/profile-renderer-utils";
import type { PublicProfileData } from "@/types/profile";

export function VisualProfileHero({
  profile,
  isPreview,
  children,
}: {
  profile: PublicProfileData;
  isPreview: boolean;
  children?: ReactNode;
}) {
  const appearance = profile.appearance;
  const hero = appearance.hero;
  const rawHeight = hero?.height ?? 360;
  const height = isPreview ? Math.max(rawHeight * 0.8, 190) : rawHeight;
  const fullBleed = hero?.fullBleed ?? true;

  return (
    <div
      className={`relative ${fullBleed ? "" : "linkzzz-hero-contained"}`}
      style={{ height: `${height}px` }}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: fullBleed ? "0px" : "24px" }}
      >
        {profile.coverImageUrl ? (
          <UserContentImage
            src={profile.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full"
            style={{
              objectFit: hero?.imageFit ?? "cover",
              objectPosition: getObjectPosition(hero?.imagePosition ?? "center"),
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                appearance.backgroundType === "gradient"
                  ? `linear-gradient(
                      145deg,
                      ${appearance.gradientFrom},
                      ${appearance.gradientTo}
                    )`
                  : `linear-gradient(
                      145deg,
                      ${appearance.backgroundColor},
                      ${appearance.gradientTo}
                    )`,
            }}
          />
        )}

        {hero?.overlayEnabled !== false && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: hero?.overlayColor ?? "#000000",
              opacity: hero?.overlayOpacity ?? 0.32,
            }}
          />
        )}

        <div
          className="absolute inset-x-0 bottom-0 h-3/4"
          style={{
            background:
              "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.64) 100%)",
          }}
        />
      </div>

      {children}
    </div>
  );
}
