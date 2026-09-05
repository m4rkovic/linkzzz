import { validateSlug } from "@/server/validation/slug";
import { MAX_PAGE_LINK_LIMIT } from "@/features/plans/plan-catalog";
import { isIsoDateTime, validateScheduleWindow } from "@/features/scheduling/schedule";
import { validateExternalUrl } from "@/server/validation/url";
import {
  DESTINATION_PROVIDERS,
  normalizeProviderDestination,
  type DestinationProviderId,
} from "@/features/destinations/provider-registry";
import { parseValidatedProfilePayload } from "@/server/profile/profile-payload-parser";
import type { PersistedProfileData } from "@/types/persisted-profile";

const PROFILE_STATUSES = new Set(["DRAFT", "PUBLISHED", "DISABLED"]);
const PLATFORM_IDS = new Set(DESTINATION_PROVIDERS.map((provider) => provider.id.toLowerCase().replaceAll("_", "-")));
const DESTINATION_PROVIDER_IDS = new Set<string>(DESTINATION_PROVIDERS.map((provider) => provider.id));

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

  if (
    !Array.isArray(profile.links) ||
    profile.links.length > MAX_PAGE_LINK_LIMIT
  ) {
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

  const contentBlocks = profile.contentBlocks ?? [];
  if (!Array.isArray(contentBlocks) || contentBlocks.length > 30) {
    return invalid("Page content blocks are invalid.");
  }
  const blockIds = new Set<string>();
  for (const rawBlock of contentBlocks) {
    const result = validateContentBlock(rawBlock);
    if (!result.ok) return result;
    if (blockIds.has(result.id)) return invalid("Page content block IDs must be unique.");
    blockIds.add(result.id);
  }

  if (!profile.appearance || typeof profile.appearance !== "object" || Array.isArray(profile.appearance)) {
    return invalid("Profile appearance is invalid.");
  }
  const appearanceResult = validateAppearance(profile.appearance);
  if (!appearanceResult.ok) return appearanceResult;

  const linkIds = new Set<string>();
  for (const rawLink of profile.links) {
    const result = validateLink(rawLink);
    if (!result.ok) return result;
    if (linkIds.has(result.id)) return invalid("Link IDs must be unique.");
    linkIds.add(result.id);
  }

  const engagementResult = validateEngagement(profile.engagement, linkIds);
  if (!engagementResult.ok) return engagementResult;

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
    value: parseValidatedProfilePayload(profile, contentBlocks, slug.value),
  };
}


function validateAppearance(value: unknown): { ok: true } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid("Profile appearance is invalid.");
  const appearance = value as Record<string, unknown>;

  if (appearance.gradientAngle !== undefined && !isFiniteNumber(appearance.gradientAngle, 0, 360)) {
    return invalid("Gradient angle is invalid.");
  }
  if (appearance.backgroundEffect !== undefined && !isOneOf(appearance.backgroundEffect, ["none", "soft-glow", "mesh"])) {
    return invalid("Background effect is invalid.");
  }
  if (appearance.backgroundEffectColor !== undefined && !isHexColor(appearance.backgroundEffectColor)) {
    return invalid("Background effect color is invalid.");
  }
  if (appearance.backgroundEffectIntensity !== undefined && !isFiniteNumber(appearance.backgroundEffectIntensity, 0, 1)) {
    return invalid("Background effect intensity is invalid.");
  }
  if (appearance.headingWeight !== undefined && ![600, 700, 800, 900].includes(Number(appearance.headingWeight))) {
    return invalid("Heading weight is invalid.");
  }
  if (appearance.headingLetterSpacing !== undefined && !isFiniteNumber(appearance.headingLetterSpacing, -0.1, 0.1)) {
    return invalid("Heading letter spacing is invalid.");
  }

  if (appearance.page !== undefined) {
    if (!appearance.page || typeof appearance.page !== "object" || Array.isArray(appearance.page)) return invalid("Page appearance is invalid.");
    const page = appearance.page as Record<string, unknown>;
    const numberFields: Array<[string, number, number]> = [
      ["maxWidth", 480, 1120],
      ["horizontalPadding", 8, 64],
      ["mobileHorizontalPadding", 8, 32],
      ["sectionSpacing", 8, 64],
      ["mobileSectionSpacing", 6, 40],
      ["verticalPadding", 0, 80],
      ["sectionSurfaceOpacity", 0, 1],
    ];
    for (const [field, min, max] of numberFields) {
      if (page[field] !== undefined && !isFiniteNumber(page[field], min, max)) return invalid(`Page appearance ${field} is invalid.`);
    }
    if (page.mobileColumns !== undefined && ![1, 2].includes(Number(page.mobileColumns))) return invalid("Mobile card columns are invalid.");
    for (const field of ["sectionBackgroundColor", "sectionBorderColor"] as const) {
      if (page[field] !== undefined && !isHexColor(page[field])) return invalid(`Page appearance ${field} is invalid.`);
    }
  }

  return { ok: true };
}

function validateContentBlock(
  value: unknown,
): { ok: true; id: string } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid("Page content block is invalid.");
  }
  const block = value as Record<string, unknown>;
  if (!isString(block.id, 1, 100) || typeof block.type !== "string" || typeof block.visible !== "boolean") {
    return invalid("Page content block is invalid.");
  }
  const schedule = validateRawSchedule(block);
  if (!schedule.ok) return invalid(schedule.error);

  switch (block.type) {
    case "TEXT":
      if (!isOptionalString(block.heading, 120) || !isString(block.body, 1, 2_000) || !isOneOf(block.alignment, ["left", "center"]) || !isOneOf(block.surface, ["plain", "card"])) {
        return invalid("Text block is invalid.");
      }
      break;
    case "CTA": {
      if (!isString(block.title, 1, 120) || !isOptionalString(block.description, 300) || !isString(block.buttonText, 1, 60) || typeof block.url !== "string" || !isOneOf(block.alignment, ["left", "center"]) || !isOneOf(block.style, ["solid", "outline", "glass"])) {
        return invalid("CTA block is invalid.");
      }
      const url = validateExternalUrl(block.url);
      if (!url.ok) return invalid(url.error);
      break;
    }
    case "EMAIL_CAPTURE":
      if (!isString(block.title, 1, 120) || !isOptionalString(block.description, 300) || !isString(block.placeholder, 1, 100) || !isString(block.buttonText, 1, 60) || !isString(block.successMessage, 1, 180)) {
        return invalid("Email capture block is invalid.");
      }
      break;
    case "COUNTDOWN":
      if (!isString(block.title, 1, 120) || !isIsoDateTime(block.targetAt) || !isString(block.completionText, 1, 180) || !isOneOf(block.alignment, ["left", "center"]) || !isOneOf(block.surface, ["plain", "card"])) {
        return invalid("Countdown block is invalid.");
      }
      break;
    case "GALLERY":
      if (!isOptionalString(block.title, 120) || ![2, 3, 4].includes(Number(block.columns)) || !isOneOf(block.aspectRatio, ["square", "portrait", "landscape"]) || !Array.isArray(block.images) || block.images.length > 12) {
        return invalid("Gallery block is invalid.");
      }
      for (const rawImage of block.images) {
        if (!rawImage || typeof rawImage !== "object" || Array.isArray(rawImage)) return invalid("Gallery image is invalid.");
        const image = rawImage as Record<string, unknown>;
        if (!isString(image.id, 1, 100) || !isOptionalString(image.imageUrl, 2048) || !isOptionalString(image.imageAssetId, 100) || !isOptionalString(image.alt, 200)) {
          return invalid("Gallery image is invalid.");
        }
      }
      break;
    case "DIVIDER":
      if (!isOneOf(block.style, ["solid", "faded"]) || !isFiniteNumber(block.thickness, 1, 8)) return invalid("Divider block is invalid.");
      break;
    case "SPACER":
      if (!isFiniteNumber(block.height, 8, 240)) return invalid("Spacer block is invalid.");
      break;
    case "EMBED": {
      if (!isOptionalString(block.title, 120) || typeof block.url !== "string") return invalid("Embed block is invalid.");
      const url = validateExternalUrl(block.url);
      if (!url.ok) return invalid(url.error);
      break;
    }
    default:
      return invalid("Unsupported page content block type.");
  }

  return { ok: true, id: block.id };
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

  if (
    link.platform !== undefined &&
    (typeof link.platform !== "string" || !PLATFORM_IDS.has(link.platform))
  ) {
    return invalid("Link platform is invalid.");
  }

  const url = validateProfileDestination(link.url, link.platform);
  if (!url.ok) return invalid(url.error);

  if (link.availability !== undefined) {
    if (!link.availability || typeof link.availability !== "object" || Array.isArray(link.availability)) {
      return invalid("Link availability is invalid.");
    }
    const availability = link.availability as Record<string, unknown>;
    const schedule = validateRawSchedule(availability);
    if (!schedule.ok) return invalid(schedule.error);
    if (availability.expiryAction !== undefined && !isOneOf(availability.expiryAction, ["HIDE", "DISABLE"])) {
      return invalid("Link expiry behavior is invalid.");
    }
  }

  if (link.sensitiveContent !== undefined) {
    if (!link.sensitiveContent || typeof link.sensitiveContent !== "object" || Array.isArray(link.sensitiveContent)) {
      return invalid("Sensitive-content warning is invalid.");
    }
    const warning = link.sensitiveContent as Record<string, unknown>;
    if (typeof warning.enabled !== "boolean") return invalid("Sensitive-content warning state is invalid.");
    if (warning.enabled) {
      if (!isString(warning.title, 1, 80)) return invalid("Sensitive-content warning title is invalid.");
      if (!isString(warning.message, 1, 300)) return invalid("Sensitive-content warning message is invalid.");
      if (!isString(warning.continueLabel, 1, 40)) return invalid("Sensitive-content warning button label is invalid.");
    }
  }

  if (link.geo !== undefined) {
    const geo = validateLinkGeo(link.geo);
    if (!geo.ok) return geo;
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

function validateLinkGeo(
  value: unknown,
): { ok: true } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid("Per-card Geo configuration is invalid.");
  }
  const geo = value as Record<string, unknown>;
  if (typeof geo.enabled !== "boolean" || !isOneOf(geo.fallback, ["SHOW", "HIDE"])) {
    return invalid("Per-card Geo configuration is invalid.");
  }
  if (!Array.isArray(geo.rules) || geo.rules.length > 50) {
    return invalid("Per-card Geo rules are invalid.");
  }

  const countries = new Set<string>();
  const ids = new Set<string>();
  for (const rawRule of geo.rules) {
    if (!rawRule || typeof rawRule !== "object" || Array.isArray(rawRule)) {
      return invalid("Per-card Geo rule is invalid.");
    }
    const rule = rawRule as Record<string, unknown>;
    if (
      !isString(rule.id, 1, 100) ||
      typeof rule.countryCode !== "string" ||
      !/^[a-z]{2}$/i.test(rule.countryCode) ||
      !isString(rule.countryName, 1, 100) ||
      !isOneOf(rule.action, ["SHOW", "HIDE", "REDIRECT"])
    ) {
      return invalid("Per-card Geo rule is invalid.");
    }

    const countryCode = rule.countryCode.toUpperCase();
    if (countryCode === "XX") return invalid("Per-card Geo country code is invalid.");
    if (countries.has(countryCode)) return invalid("Per-card Geo countries must be unique per link.");
    if (ids.has(rule.id)) return invalid("Per-card Geo rule IDs must be unique.");
    countries.add(countryCode);
    ids.add(rule.id);

    if (rule.action === "REDIRECT") {
      const destination = validateGeoDestinationConfig(rule.destination);
      if (!destination.ok) return destination;
    } else if (rule.destination !== undefined) {
      return invalid("Only Geo redirect rules may contain a destination.");
    }
  }

  return { ok: true };
}

function validateGeoDestinationConfig(
  value: unknown,
): { ok: true } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid("Geo redirect destination is invalid.");
  }
  const destination = value as Record<string, unknown>;
  if (
    typeof destination.provider !== "string" ||
    !DESTINATION_PROVIDER_IDS.has(destination.provider) ||
    typeof destination.url !== "string" ||
    !isOptionalString(destination.value, 2_048) ||
    !isOptionalString(destination.label, 100)
  ) {
    return invalid("Geo redirect destination is invalid.");
  }

  const input = typeof destination.value === "string" && destination.value.trim()
    ? destination.value
    : destination.url;
  const normalized = normalizeProviderDestination(
    destination.provider as DestinationProviderId,
    input,
  );
  if (!normalized.ok) return invalid(normalized.error);
  if (!destination.url.trim() || normalized.value.url !== destination.url.trim()) {
    return invalid("Geo redirect destination must contain its normalized URL.");
  }

  if (destination.fallbackUrl !== undefined) {
    if (typeof destination.fallbackUrl !== "string") return invalid("Geo redirect fallback is invalid.");
    const fallback = validateExternalUrl(destination.fallbackUrl);
    if (!fallback.ok) return invalid(fallback.error);
  }

  return { ok: true };
}

function validateEngagement(
  value: unknown,
  linkIds: Set<string>,
): { ok: true } | { ok: false; error: string } {
  if (value === undefined) return { ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid("Profile engagement settings are invalid.");
  }

  const engagement = value as Record<string, unknown>;

  if (engagement.visitorMessaging !== undefined) {
    if (!engagement.visitorMessaging || typeof engagement.visitorMessaging !== "object" || Array.isArray(engagement.visitorMessaging)) {
      return invalid("Visitor messaging settings are invalid.");
    }
    const messaging = engagement.visitorMessaging as Record<string, unknown>;
    if (messaging.activeIndicator !== undefined && !isOneOf(messaging.activeIndicator, ["OFF", "STATIC_ACTIVE"])) {
      return invalid("Active indicator setting is invalid.");
    }
    if (messaging.responseTime !== undefined && !isOneOf(messaging.responseTime, ["OFF", "TEN_MINUTES", "ONE_HOUR", "CUSTOM"])) {
      return invalid("Response time setting is invalid.");
    }
    if (messaging.customResponseTime !== undefined && !isOptionalString(messaging.customResponseTime, 80)) {
      return invalid("Custom response time is invalid.");
    }
    if (messaging.responseTime === "CUSTOM" && !isString(messaging.customResponseTime, 1, 80)) {
      return invalid("Custom response time is required.");
    }
  }

  if (engagement.featuredLinkId !== undefined) {
    if (!isString(engagement.featuredLinkId, 1, 100) || !linkIds.has(engagement.featuredLinkId)) {
      return invalid("Featured link is invalid.");
    }
  }

  if (engagement.campaign === undefined) return { ok: true };
  if (!engagement.campaign || typeof engagement.campaign !== "object" || Array.isArray(engagement.campaign)) {
    return invalid("Campaign settings are invalid.");
  }

  const campaign = engagement.campaign as Record<string, unknown>;
  if (typeof campaign.enabled !== "boolean") return invalid("Campaign state is invalid.");
  if (campaign.primaryLinkId !== undefined) {
    if (!isString(campaign.primaryLinkId, 1, 100) || !linkIds.has(campaign.primaryLinkId)) {
      return invalid("Campaign primary link is invalid.");
    }
  }
  if (campaign.enabled && typeof campaign.primaryLinkId !== "string") {
    return invalid("Campaign primary link is required while campaign mode is enabled.");
  }
  if (campaign.pinPrimary !== undefined && typeof campaign.pinPrimary !== "boolean") {
    return invalid("Campaign pin behavior is invalid.");
  }
  if (campaign.dimSiblings !== undefined && typeof campaign.dimSiblings !== "boolean") {
    return invalid("Campaign dim behavior is invalid.");
  }
  if (campaign.focusEffect !== undefined && !isOneOf(campaign.focusEffect, ["none", "glow", "shake", "glow-shake"])) {
    return invalid("Campaign focus effect is invalid.");
  }
  if (campaign.focusColor !== undefined && !isHexColor(campaign.focusColor)) {
    return invalid("Campaign focus color is invalid.");
  }
  const schedule = validateRawSchedule(campaign);
  if (!schedule.ok) return invalid(schedule.error);

  return { ok: true };
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

  if (
    social.platform !== undefined &&
    (typeof social.platform !== "string" || !PLATFORM_IDS.has(social.platform))
  ) {
    return invalid("Social platform is invalid.");
  }

  const url = validateProfileDestination(social.url, social.platform);
  if (!url.ok) return invalid(url.error);

  return { ok: true, id: social.id };
}

function validateProfileDestination(url: string, platform: unknown) {
  if (typeof platform !== "string" || !PLATFORM_IDS.has(platform)) {
    return validateExternalUrl(url);
  }
  const provider = platform.toUpperCase().replaceAll("-", "_") as DestinationProviderId;
  const normalized = normalizeProviderDestination(provider, url);
  if (!normalized.ok) return { ok: false as const, error: normalized.error };
  return { ok: true as const, value: normalized.value.url };
}

function validateRawSchedule(value: Record<string, unknown>) {
  if (value.visibleFrom !== undefined && !isIsoDateTime(value.visibleFrom)) {
    return { ok: false as const, error: "Scheduled start time is invalid." };
  }
  if (value.visibleUntil !== undefined && !isIsoDateTime(value.visibleUntil)) {
    return { ok: false as const, error: "Scheduled end time is invalid." };
  }

  const error = validateScheduleWindow({
    visibleFrom: value.visibleFrom as string | undefined,
    visibleUntil: value.visibleUntil as string | undefined,
  });
  if (error) return { ok: false as const, error };
  return { ok: true as const };
}

function isString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.length >= min && value.length <= max;
}

function isOptionalString(value: unknown, max: number) {
  return value === undefined || (typeof value === "string" && value.length <= max);
}

function isOneOf(value: unknown, values: readonly string[]) {
  return typeof value === "string" && values.includes(value);
}

function isFiniteNumber(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isHexColor(value: unknown) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function invalid(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
