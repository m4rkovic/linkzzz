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
    },
    {
      id: "youtube",
      name: "YouTube",
      platform: "youtube",
      url: "https://youtube.com/",
      visible: true,
    },
    {
      id: "spotify",
      name: "Spotify",
      platform: "spotify",
      url: "https://open.spotify.com/",
      visible: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      platform: "facebook",
      url: "https://facebook.com/",
      visible: true,
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

  contentBlocks: [],

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
 * Returns an independent mock profile tree for mutable client state without
 * introducing non-serializable UI references.
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
    contentBlocks: profile.contentBlocks.map((block) => block.type === "GALLERY" ? { ...block, images: block.images.map((image) => ({ ...image })) } : { ...block }),
    links: profile.links.map((link) => ({
      ...link,
      geoDestinations: link.geoDestinations.map((destination) => ({
        ...destination,
      })),
      geo: link.geo
        ? {
            ...link.geo,
            rules: link.geo.rules.map((rule) => ({
              ...rule,
              destination: rule.destination ? { ...rule.destination } : undefined,
            })),
          }
        : undefined,
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
