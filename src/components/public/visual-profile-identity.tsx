import { MapPin } from "lucide-react";

import { ProfileAvatar } from "@/components/public/profile-renderer-shared";
import { getAvatarRadius } from "@/components/public/profile-renderer-utils";
import type { PublicProfileData } from "@/types/profile";

export function VisualProfileIdentity({
  profile,
  isPreview,
  heroEnabled,
  alignmentOverride,
  primaryColor,
  secondaryColor,
  showAvatar = true,
  showName = true,
  showUsername = true,
  showBio = true,
  showLocation = true,
}: {
  profile: PublicProfileData;
  isPreview: boolean;
  heroEnabled: boolean;
  alignmentOverride?: "left" | "center";
  primaryColor: string;
  secondaryColor: string;
  showAvatar?: boolean;
  showName?: boolean;
  showUsername?: boolean;
  showBio?: boolean;
  showLocation?: boolean;
}) {
  const identity = profile.appearance.identity;
  const alignment = alignmentOverride ?? identity?.alignment ?? "center";
  const avatarSize = identity?.avatarSize ?? 88;
  const nameSize = identity?.nameSize ?? 28;
  const alignClass =
    alignment === "left" ? "items-start text-left" : "items-center text-center";

  return (
    <header className={`flex flex-col ${alignClass}`}>
      {showAvatar && (
        <ProfileAvatar
          profile={profile}
          size={isPreview ? Math.max(avatarSize * 0.78, 54) : avatarSize}
          radius={getAvatarRadius(identity?.avatarShape ?? "circle")}
          elevated={heroEnabled}
        />
      )}

      {showName && (
        <h1
          className={`font-black tracking-[-0.03em] ${showAvatar ? "mt-4" : ""}`}
          style={{
            fontSize: `${isPreview ? Math.max(nameSize * 0.76, 18) : nameSize}px`,
            color: primaryColor,
          }}
        >
          {profile.displayName}
        </h1>
      )}

      {showUsername && profile.username && (
        <p className="mt-1 text-sm font-medium" style={{ color: secondaryColor }}>
          @{profile.username}
        </p>
      )}

      {showBio && profile.bio && (
        <p
          className={`mt-3 leading-6 ${
            isPreview ? "text-xs" : "text-sm sm:text-[15px]"
          }`}
          style={{
            maxWidth: `${identity?.bioMaxWidth ?? 520}px`,
            color: secondaryColor,
          }}
        >
          {profile.bio}
        </p>
      )}

      {showLocation && profile.locationLabel && (
        <div
          className="mt-3 flex items-center gap-1.5 text-xs"
          style={{ color: secondaryColor }}
        >
          <MapPin size={13} />
          {profile.locationLabel}
        </div>
      )}
    </header>
  );
}
