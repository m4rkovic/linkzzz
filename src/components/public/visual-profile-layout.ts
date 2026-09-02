import type {
  HeroContentPosition,
  PageMobileColumns,
  PublicProfileData,
} from "@/types/profile";

export type VisualProfileLayout = {
  maxWidth: number;
  heroEnabled: boolean;
  contentPosition: HeroContentPosition;
  identityInsideHero: boolean;
  identityAlignment: "left" | "center";
  showAvatar: boolean;
  showName: boolean;
  showUsername: boolean;
  showBio: boolean;
  showLocation: boolean;
  showSocials: boolean;
  showStats: boolean;
  heroPrimary: string;
  heroSecondary: string;
  cardGap: number;
  mobileColumns: PageMobileColumns;
  verticalPadding: number;
  heroAvatarOverlap: number;
};

export function resolveVisualProfileLayout(
  profile: PublicProfileData,
): VisualProfileLayout {
  const { page, hero, identity, cards } = profile.appearance;
  const heroEnabled = hero?.enabled ?? false;
  const contentPosition =
    hero?.contentPosition ??
    (hero?.profilePosition === "below-hero" ? "below" : "bottom-center");

  return {
    maxWidth: page?.maxWidth ?? 760,
    heroEnabled,
    contentPosition,
    identityInsideHero: heroEnabled && contentPosition !== "below",
    identityAlignment: contentPosition === "bottom-left" ? "left" : "center",
    showAvatar: heroEnabled ? (hero?.showAvatar ?? true) : true,
    showName: heroEnabled ? (hero?.showName ?? true) : true,
    showUsername: heroEnabled ? (hero?.showUsername ?? true) : true,
    showBio: heroEnabled ? (hero?.showBio ?? true) : true,
    showLocation: heroEnabled
      ? (hero?.showLocation ?? true)
      : (identity?.showLocation ?? true),
    showSocials: heroEnabled ? (hero?.showSocials ?? true) : true,
    showStats: heroEnabled
      ? (hero?.showStats ?? true)
      : (identity?.showStats ?? true),
    heroPrimary: hero?.heroTextColor ?? "#ffffff",
    heroSecondary: hero?.heroSecondaryTextColor ?? "#d4d4d8",
    cardGap: cards?.spacing ?? 12,
    mobileColumns: page?.mobileColumns ?? 2,
    verticalPadding: page?.verticalPadding ?? 28,
    heroAvatarOverlap: Math.min(hero?.avatarOverlap ?? 44, 100),
  };
}
