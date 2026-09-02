import type { PersistedProfileData } from "@/types/persisted-profile";

export type PublicDestinationKind = "card" | "social" | "block";

export function withSmartLinkOutboundRoutes(
  profile: PersistedProfileData,
  slug: string,
): PersistedProfileData {
  const encodedSlug = encodeURIComponent(slug);
  return {
    ...profile,
    links: profile.links.map((link) => ({
      ...link,
      url: `/${encodedSlug}/out/card/${encodeURIComponent(link.id)}`,
      geo: undefined,
      geoDestinations: [],
    })),
    socials: profile.socials.map((social) => ({
      ...social,
      url: `/${encodedSlug}/out/social/${encodeURIComponent(social.id)}`,
    })),
    contentBlocks: (profile.contentBlocks ?? []).map((block) =>
      block.type === "CTA"
        ? { ...block, url: `/${encodedSlug}/out/block/${encodeURIComponent(block.id)}` }
        : block,
    ),
  };
}

export function isPublicDestinationKind(value: string): value is PublicDestinationKind {
  return value === "card" || value === "social" || value === "block";
}
