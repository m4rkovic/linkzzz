import { getPlatformIcon } from "@/config/platforms";
import { defaultAppearance } from "@/config/profile-defaults";

import type {
  PublicProfileData,
  VisitorLocation,
} from "@/types/profile";

export const mockVisitor: VisitorLocation = {
  countryCode: "RS",
  countryName: "Serbia",
  flag: "🇷🇸",
};

const skyHookProfile: PublicProfileData = {
  slug: "skyhook",
  username: "skyhook",
  displayName: "Sky Hook",
  bio: "Alternative rock band from Niš, Serbia.",
  locationLabel: "Niš, Serbia",
  status: "PUBLISHED",

  avatarUrl: undefined,
  coverImageUrl: undefined,
  stats: [],

  socials: [
    {
      id: "instagram",
      name: "Instagram",
      platform: "instagram",
      url: "https://instagram.com/",
      visible: true,
      icon: getPlatformIcon("instagram"),
    },
    {
      id: "youtube",
      name: "YouTube",
      platform: "youtube",
      url: "https://youtube.com/",
      visible: true,
      icon: getPlatformIcon("youtube"),
    },
    {
      id: "spotify",
      name: "Spotify",
      platform: "spotify",
      url: "https://open.spotify.com/",
      visible: true,
      icon: getPlatformIcon("spotify"),
    },
    {
      id: "facebook",
      name: "Facebook",
      platform: "facebook",
      url: "https://facebook.com/",
      visible: true,
      icon: getPlatformIcon("facebook"),
    },
  ],

  links: [
    {
      id: "spotify",
      title: "Listen on Spotify",
      description: "Stream our latest releases",
      url: "https://open.spotify.com/",
      visible: true,
      platform: "spotify",
      icon: getPlatformIcon("spotify"),
      layout: "featured",
      imageUrl: undefined,
      imageAlt: "Sky Hook on Spotify",
      imageFit: "cover",
      imagePosition: "center",
      showPlatformIcon: true,
      showTitle: true,
      showDescription: false,
      overlayEnabled: true,
      overlayOpacity: 0.38,
      titlePosition: "bottom-center",
      geoDestinations: [],
    },
    {
      id: "instagram",
      title: "Instagram",
      description: "Follow us for updates",
      url: "https://instagram.com/",
      visible: true,
      platform: "instagram",
      icon: getPlatformIcon("instagram"),
      layout: "half",
      imageUrl: undefined,
      imageAlt: "Sky Hook Instagram",
      imageFit: "cover",
      imagePosition: "center",
      showPlatformIcon: true,
      showTitle: true,
      showDescription: false,
      overlayEnabled: true,
      overlayOpacity: 0.38,
      titlePosition: "bottom-center",
      geoDestinations: [],
    },
    {
      id: "youtube",
      title: "Latest video",
      description: "Watch on YouTube",
      url: "https://youtube.com/",
      visible: true,
      platform: "youtube",
      icon: getPlatformIcon("youtube"),
      layout: "half",
      imageUrl: undefined,
      imageAlt: "Sky Hook YouTube",
      imageFit: "cover",
      imagePosition: "center",
      showPlatformIcon: true,
      showTitle: true,
      showDescription: false,
      overlayEnabled: true,
      overlayOpacity: 0.38,
      titlePosition: "bottom-center",
      geoDestinations: [],
    },
  ],

  appearance: defaultAppearance,
};

export const mockProfiles: Record<string, PublicProfileData> = {
  skyhook: skyHookProfile,
};

export function getMockProfileBySlug(
  slug: string,
): PublicProfileData | undefined {
  return mockProfiles[normalizeSlug(slug)];
}

/**
 * Returns an independent mock profile tree for mutable client state.
 * React component references used as icons are intentionally preserved.
 */
export function createMockProfileBySlug(
  slug: string,
): PublicProfileData | undefined {
  const profile = getMockProfileBySlug(slug);

  if (!profile) {
    return undefined;
  }

  return {
    ...profile,
    stats: profile.stats?.map((stat) => ({ ...stat })),
    socials: profile.socials.map((social) => ({ ...social })),
    links: profile.links.map((link) => ({
      ...link,
      geoDestinations: link.geoDestinations.map((destination) => ({
        ...destination,
      })),
      customStyle: link.customStyle
        ? { ...link.customStyle }
        : undefined,
    })),
    appearance: {
      ...profile.appearance,
      page: profile.appearance.page
        ? { ...profile.appearance.page }
        : undefined,
      hero: profile.appearance.hero
        ? { ...profile.appearance.hero }
        : undefined,
      identity: profile.appearance.identity
        ? { ...profile.appearance.identity }
        : undefined,
      cards: profile.appearance.cards
        ? { ...profile.appearance.cards }
        : undefined,
    },
  };
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}
