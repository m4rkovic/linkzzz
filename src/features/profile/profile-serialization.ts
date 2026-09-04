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
    contentBlocks: (profile.contentBlocks ?? []).map(cloneContentBlock),
    engagement: profile.engagement
      ? {
          ...profile.engagement,
          campaign: profile.engagement.campaign
            ? { ...profile.engagement.campaign }
            : undefined,
        }
      : undefined,
    socials: profile.socials.map((social) => ({ ...social })),
    links: profile.links.map((link) => ({
      ...link,
      geoDestinations: link.geoDestinations.map((destination) => ({
        ...destination,
      })),
      customStyle: link.customStyle ? { ...link.customStyle } : undefined,
      availability: link.availability ? { ...link.availability } : undefined,
      sensitiveContent: link.sensitiveContent ? { ...link.sensitiveContent } : undefined,
      geo: link.geo
        ? {
            ...link.geo,
            rules: link.geo.rules.map((rule) => ({
              ...rule,
              destination: rule.destination
                ? {
                    ...rule.destination,
                    deeplinkOverrides: rule.destination.deeplinkOverrides
                      ? { ...rule.destination.deeplinkOverrides }
                      : undefined,
                  }
                : undefined,
            })),
          }
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

function cloneContentBlock(block: PublicProfileData["contentBlocks"][number]) {
  return block.type === "GALLERY"
    ? { ...block, images: block.images.map((image) => ({ ...image })) }
    : { ...block };
}
