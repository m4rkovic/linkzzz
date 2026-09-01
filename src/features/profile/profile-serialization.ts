import { getPlatformIcon } from "@/config/platforms";

import type { PersistedProfileData } from "@/types/persisted-profile";
import type { PublicProfileData } from "@/types/profile";

export function serializeProfile(
  profile: PublicProfileData,
): PersistedProfileData {
  return JSON.parse(JSON.stringify(profile)) as PersistedProfileData;
}

export function hydrateProfile(
  profile: PersistedProfileData,
): PublicProfileData {
  return {
    ...profile,
    stats: profile.stats?.map((stat) => ({ ...stat })),
    socials: profile.socials.map((social) => ({
      ...social,
      icon: getPlatformIcon(social.platform ?? "custom"),
    })),
    links: profile.links.map((link) => ({
      ...link,
      icon: getPlatformIcon(link.platform ?? "custom"),
      geoDestinations: link.geoDestinations.map((destination) => ({
        ...destination,
      })),
      customStyle: link.customStyle ? { ...link.customStyle } : undefined,
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
