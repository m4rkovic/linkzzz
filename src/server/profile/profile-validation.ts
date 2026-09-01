import "server-only";

import { validateSlug } from "@/server/validation/slug";
import { validateExternalUrl } from "@/server/validation/url";
import type { PersistedProfileData } from "@/types/persisted-profile";

const PROFILE_STATUSES = new Set(["DRAFT", "PUBLISHED", "DISABLED"]);
const PLATFORM_IDS = new Set([
  "custom",
  "website",
  "instagram",
  "tiktok",
  "youtube",
  "spotify",
  "facebook",
  "x",
  "threads",
  "twitch",
  "discord",
  "telegram",
  "linkedin",
  "github",
  "soundcloud",
]);

export type ProfilePayloadValidationResult =
  | { ok: true; value: PersistedProfileData }
  | { ok: false; error: string };

export function validateProfilePayload(
  value: unknown,
): ProfilePayloadValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid("Invalid profile payload.");
  }

  const profile = value as Record<string, unknown>;

  if (typeof profile.slug !== "string") {
    return invalid("Profile slug is required.");
  }

  const slug = validateSlug(profile.slug);
  if (!slug.ok) return invalid(slug.error);

  if (!isString(profile.displayName, 1, 60)) {
    return invalid("Display name must contain 1 to 60 characters.");
  }

  if (!isOptionalString(profile.username, 60)) {
    return invalid("Username is invalid.");
  }

  if (!isString(profile.bio, 0, 160)) {
    return invalid("Bio cannot exceed 160 characters.");
  }

  if (!isOptionalString(profile.avatarUrl, 2048)) {
    return invalid("Avatar URL is invalid.");
  }

  if (!isOptionalString(profile.avatarAssetId, 100)) {
    return invalid("Avatar asset is invalid.");
  }

  if (!isOptionalString(profile.coverImageUrl, 2048)) {
    return invalid("Cover URL is invalid.");
  }

  if (!isOptionalString(profile.coverAssetId, 100)) {
    return invalid("Cover asset is invalid.");
  }

  if (!isOptionalString(profile.locationLabel, 100)) {
    return invalid("Location is invalid.");
  }

  if (typeof profile.status !== "string" || !PROFILE_STATUSES.has(profile.status)) {
    return invalid("Profile status is invalid.");
  }

  if (!Array.isArray(profile.links) || profile.links.length > 100) {
    return invalid("Profile links are invalid.");
  }

  if (!Array.isArray(profile.socials) || profile.socials.length > 20) {
    return invalid("Social links are invalid.");
  }

  if (
    profile.stats !== undefined &&
    (!Array.isArray(profile.stats) || profile.stats.length > 4)
  ) {
    return invalid("Profile stats are invalid.");
  }

  if (!profile.appearance || typeof profile.appearance !== "object") {
    return invalid("Profile appearance is invalid.");
  }

  const linkIds = new Set<string>();
  for (const rawLink of profile.links) {
    const result = validateLink(rawLink);
    if (!result.ok) return result;
    if (linkIds.has(result.id)) return invalid("Link IDs must be unique.");
    linkIds.add(result.id);
  }

  const socialIds = new Set<string>();
  for (const rawSocial of profile.socials) {
    const result = validateSocial(rawSocial);
    if (!result.ok) return result;
    if (socialIds.has(result.id)) return invalid("Social IDs must be unique.");
    socialIds.add(result.id);
  }

  if (Array.isArray(profile.stats)) {
    const statIds = new Set<string>();
    for (const rawStat of profile.stats) {
      if (!rawStat || typeof rawStat !== "object" || Array.isArray(rawStat)) {
        return invalid("Profile stat is invalid.");
      }
      const stat = rawStat as Record<string, unknown>;
      if (
        !isString(stat.id, 1, 100) ||
        !isString(stat.value, 0, 40) ||
        !isString(stat.label, 0, 60) ||
        typeof stat.visible !== "boolean"
      ) {
        return invalid("Profile stat is invalid.");
      }
      if (statIds.has(stat.id)) return invalid("Profile stat IDs must be unique.");
      statIds.add(stat.id);
    }
  }

  return {
    ok: true,
    value: {
      ...(structuredClone(value) as PersistedProfileData),
      slug: slug.value,
      displayName: profile.displayName.trim(),
      username:
        typeof profile.username === "string" ? profile.username.trim() : undefined,
      bio: profile.bio,
      locationLabel:
        typeof profile.locationLabel === "string"
          ? profile.locationLabel.trim()
          : undefined,
    },
  };
}

function validateLink(
  value: unknown,
): { ok: true; id: string } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid("Link is invalid.");
  }

  const link = value as Record<string, unknown>;
  if (
    !isString(link.id, 1, 100) ||
    !isString(link.title, 1, 120) ||
    !isOptionalString(link.description, 300) ||
    !isOptionalString(link.imageAssetId, 100) ||
    typeof link.visible !== "boolean"
  ) {
    return invalid("Link is invalid.");
  }

  if (typeof link.url !== "string") return invalid("Link URL is invalid.");
  const url = validateExternalUrl(link.url);
  if (!url.ok) return invalid(url.error);

  if (
    link.platform !== undefined &&
    (typeof link.platform !== "string" || !PLATFORM_IDS.has(link.platform))
  ) {
    return invalid("Link platform is invalid.");
  }

  if (!Array.isArray(link.geoDestinations) || link.geoDestinations.length > 50) {
    return invalid("Geo destinations are invalid.");
  }

  const destinationCountryCodes = new Set<string>();
  for (const rawDestination of link.geoDestinations) {
    if (
      !rawDestination ||
      typeof rawDestination !== "object" ||
      Array.isArray(rawDestination)
    ) {
      return invalid("Geo destination is invalid.");
    }
    const destination = rawDestination as Record<string, unknown>;
    if (
      !isString(destination.id, 1, 100) ||
      typeof destination.countryCode !== "string" ||
      !/^[a-z]{2}$/i.test(destination.countryCode) ||
      !isString(destination.countryName, 1, 100) ||
      typeof destination.url !== "string"
    ) {
      return invalid("Geo destination is invalid.");
    }
    const destinationUrl = validateExternalUrl(destination.url);
    if (!destinationUrl.ok) return invalid(destinationUrl.error);

    const normalizedCountryCode = destination.countryCode.toUpperCase();
    if (destinationCountryCodes.has(normalizedCountryCode)) {
      return invalid("Geo destination countries must be unique per link.");
    }
    destinationCountryCodes.add(normalizedCountryCode);
  }

  return { ok: true, id: link.id };
}

function validateSocial(
  value: unknown,
): { ok: true; id: string } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid("Social link is invalid.");
  }

  const social = value as Record<string, unknown>;
  if (
    !isString(social.id, 1, 100) ||
    !isString(social.name, 1, 80) ||
    typeof social.visible !== "boolean" ||
    typeof social.url !== "string"
  ) {
    return invalid("Social link is invalid.");
  }

  const url = validateExternalUrl(social.url);
  if (!url.ok) return invalid(url.error);

  if (
    social.platform !== undefined &&
    (typeof social.platform !== "string" || !PLATFORM_IDS.has(social.platform))
  ) {
    return invalid("Social platform is invalid.");
  }

  return { ok: true, id: social.id };
}

function isString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.length >= min && value.length <= max;
}

function isOptionalString(value: unknown, max: number) {
  return value === undefined || (typeof value === "string" && value.length <= max);
}

function invalid(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
