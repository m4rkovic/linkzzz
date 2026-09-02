"use client";

import { ClassicProfileRenderer } from "@/components/public/classic-profile-renderer";
import { UnavailableProfile } from "@/components/public/profile-renderer-shared";
import { VisualProfileRenderer } from "@/components/public/visual-profile-renderer";
import type { PublicProfileData, VisitorLocation } from "@/types/profile";

type ProfileRendererProps = {
  profile: PublicProfileData;
  visitor?: VisitorLocation;
  mode?: "public" | "preview";
  onShare?: () => void;
  onLinkClick?: (linkId: string) => void;
  onSocialClick?: (socialId: string) => void;
  initialNowMs?: number;
};

export default function ProfileRenderer({
  profile,
  visitor,
  mode = "public",
  onShare,
  onLinkClick,
  onSocialClick,
  initialNowMs = 0,
}: ProfileRendererProps) {
  const isPreview = mode === "preview";

  if (!isPreview && profile.status !== "PUBLISHED") {
    return <UnavailableProfile status={profile.status} />;
  }

  if ((profile.appearance.layoutMode ?? "classic") === "visual") {
    return (
      <VisualProfileRenderer
        profile={profile}
        visitor={visitor}
        isPreview={isPreview}
        onShare={onShare}
        onLinkClick={onLinkClick}
        onSocialClick={onSocialClick}
        initialNowMs={initialNowMs}
      />
    );
  }

  return (
    <ClassicProfileRenderer
      profile={profile}
      visitor={visitor}
      isPreview={isPreview}
      onShare={onShare}
      onLinkClick={onLinkClick}
      onSocialClick={onSocialClick}
      initialNowMs={initialNowMs}
    />
  );
}
