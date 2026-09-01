import type { ProfileAppearance } from "@/types/profile";

/**
 * Shared default profile appearance.
 *
 * This lives outside React context so server and client modules can reuse the
 * same defaults without importing a client-only provider module.
 */
export const defaultAppearance: ProfileAppearance = {
  layoutMode: "classic",

  backgroundType: "solid",
  backgroundColor: "#111214",
  gradientFrom: "#111214",
  gradientTo: "#18181b",

  primaryTextColor: "#ffffff",
  secondaryTextColor: "#a1a1aa",
  fontFamily: "Inter, Arial, sans-serif",

  buttonStyle: "glass",
  buttonBackgroundColor: "#18181b",
  buttonTextColor: "#ffffff",
  buttonBorderColor: "#ffffff",
  borderRadius: 16,
  buttonSpacing: 12,
  shadow: 2,

  page: {
    maxWidth: 760,
    horizontalPadding: 20,
    sectionSpacing: 20,
  },

  hero: {
    enabled: false,
    height: 360,
    overlayEnabled: true,
    overlayColor: "#000000",
    overlayOpacity: 0.32,
    imageFit: "cover",
    imagePosition: "center",
    profilePosition: "over-hero",
    fullBleed: true,
    contentPosition: "bottom-center",
    avatarOverlap: 44,
    showAvatar: true,
    showName: true,
    showUsername: true,
    showBio: true,
    showSocials: true,
    showLocation: true,
    showStats: true,
    heroTextColor: "#ffffff",
    heroSecondaryTextColor: "#d4d4d8",
  },

  identity: {
    alignment: "center",
    avatarSize: 88,
    avatarShape: "circle",
    nameSize: 28,
    bioMaxWidth: 520,
    socialIconSize: 22,
    socialIconStyle: "circle",
    showLocation: true,
    showStats: true,
  },

  cards: {
    defaultLayout: "button",
    borderRadius: 18,
    spacing: 12,
    cardHeight: 220,
    featuredHeight: 340,
    imageFit: "cover",
    overlayColor: "#000000",
    overlayOpacity: 0.42,
    titlePosition: "bottom-left",
    titleSize: 20,
    borderWidth: 1,
    shadow: 2,
    hoverEffect: "lift",
  },
};
