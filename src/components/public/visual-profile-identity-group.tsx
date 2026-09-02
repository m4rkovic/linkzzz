import {
  ProfileStats,
  ProfileVisitorSignals,
  SocialLinks,
} from "@/components/public/profile-renderer-shared";
import { VisualProfileIdentity } from "@/components/public/visual-profile-identity";
import type { PublicProfileData } from "@/types/profile";

export function VisualProfileIdentityGroup({
  profile,
  isPreview,
  heroEnabled,
  alignmentOverride,
  primaryColor,
  secondaryColor,
  showAvatar,
  showName,
  showUsername,
  showBio,
  showLocation,
  showSocials,
  showStats,
  onSocialClick,
}: {
  profile: PublicProfileData;
  isPreview: boolean;
  heroEnabled: boolean;
  alignmentOverride?: "left" | "center";
  primaryColor: string;
  secondaryColor: string;
  showAvatar: boolean;
  showName: boolean;
  showUsername: boolean;
  showBio: boolean;
  showLocation: boolean;
  showSocials: boolean;
  showStats: boolean;
  onSocialClick?: (socialId: string) => void;
}) {
  return (
    <>
      <VisualProfileIdentity
        profile={profile}
        isPreview={isPreview}
        heroEnabled={heroEnabled}
        alignmentOverride={alignmentOverride}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        showAvatar={showAvatar}
        showName={showName}
        showUsername={showUsername}
        showBio={showBio}
        showLocation={showLocation}
      />

      <ProfileVisitorSignals
        profile={profile}
        alignment={alignmentOverride}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {showSocials && (
        <SocialLinks
          profile={profile}
          isPreview={isPreview}
          mode="visual"
          alignmentOverride={alignmentOverride}
          colorOverride={primaryColor}
          onSocialClick={onSocialClick}
        />
      )}

      {showStats && (
        <ProfileStats
          profile={profile}
          isPreview={isPreview}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          alignment={alignmentOverride}
        />
      )}
    </>
  );
}
