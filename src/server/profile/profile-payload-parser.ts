import type {
  PersistedProfileData,
  PersistedProfileLink,
  PersistedSocialLink,
} from "@/types/persisted-profile";
import type { PageContentBlock } from "@/types/profile";

type UnknownRecord = Record<string, unknown>;

const APPEARANCE_FIELDS = [
  "layoutMode",
  "backgroundType",
  "backgroundColor",
  "gradientFrom",
  "gradientTo",
  "gradientAngle",
  "backgroundEffect",
  "backgroundEffectColor",
  "backgroundEffectIntensity",
  "primaryTextColor",
  "secondaryTextColor",
  "fontFamily",
  "headingWeight",
  "headingLetterSpacing",
  "buttonStyle",
  "buttonBackgroundColor",
  "buttonTextColor",
  "buttonBorderColor",
  "borderRadius",
  "buttonSpacing",
  "shadow",
] as const;

const PAGE_APPEARANCE_FIELDS = [
  "maxWidth",
  "horizontalPadding",
  "mobileHorizontalPadding",
  "sectionSpacing",
  "mobileSectionSpacing",
  "verticalPadding",
  "mobileColumns",
  "sectionBackgroundColor",
  "sectionBorderColor",
  "sectionSurfaceOpacity",
] as const;

const HERO_APPEARANCE_FIELDS = [
  "enabled",
  "height",
  "overlayEnabled",
  "overlayColor",
  "overlayOpacity",
  "imageFit",
  "imagePosition",
  "profilePosition",
  "fullBleed",
  "contentPosition",
  "avatarOverlap",
  "showAvatar",
  "showName",
  "showUsername",
  "showBio",
  "showSocials",
  "showLocation",
  "showStats",
  "heroTextColor",
  "heroSecondaryTextColor",
] as const;

const IDENTITY_APPEARANCE_FIELDS = [
  "alignment",
  "avatarSize",
  "avatarShape",
  "nameSize",
  "bioMaxWidth",
  "socialIconSize",
  "socialIconStyle",
  "showLocation",
  "showStats",
] as const;

const CARD_APPEARANCE_FIELDS = [
  "defaultLayout",
  "borderRadius",
  "spacing",
  "cardHeight",
  "featuredHeight",
  "imageFit",
  "overlayColor",
  "overlayOpacity",
  "titlePosition",
  "titleSize",
  "borderWidth",
  "shadow",
  "hoverEffect",
] as const;

const LINK_FIELDS = [
  "id",
  "title",
  "description",
  "url",
  "visible",
  "platform",
  "layout",
  "aspectRatio",
  "imageUrl",
  "imageAssetId",
  "imageAlt",
  "imageFit",
  "imagePosition",
  "showPlatformIcon",
  "showTitle",
  "showDescription",
  "overlayEnabled",
  "overlayOpacity",
  "titlePosition",
] as const;

const LINK_CUSTOM_STYLE_FIELDS = [
  "enabled",
  "backgroundType",
  "backgroundColor",
  "gradientFrom",
  "gradientTo",
  "textColor",
  "borderColor",
  "borderRadius",
  "height",
  "borderWidth",
  "shadow",
  "overlayColor",
  "overlayOpacity",
  "platformBadgeStyle",
  "platformBadgePosition",
  "platformBadgeBackgroundColor",
  "platformBadgeTextColor",
  "focusEffect",
  "dimSiblings",
  "focusColor",
  "focusDelayMs",
  "focusDurationMs",
  "focusOncePerSession",
  "badgeText",
  "badgeBackgroundColor",
  "badgeTextColor",
  "ctaText",
  "ctaStyle",
  "ctaBackgroundColor",
  "ctaTextColor",
  "titleSize",
  "descriptionSize",
  "descriptionColor",
  "contentPadding",
  "imageScale",
] as const;

const CONTENT_BLOCK_FIELDS = {
  TEXT: ["id", "type", "visible", "heading", "body", "alignment", "surface", "visibleFrom", "visibleUntil"],
  CTA: ["id", "type", "visible", "title", "description", "buttonText", "url", "alignment", "style", "visibleFrom", "visibleUntil"],
  EMAIL_CAPTURE: ["id", "type", "visible", "title", "description", "placeholder", "buttonText", "successMessage", "visibleFrom", "visibleUntil"],
  GALLERY: ["id", "type", "visible", "title", "columns", "aspectRatio", "visibleFrom", "visibleUntil"],
  DIVIDER: ["id", "type", "visible", "style", "thickness", "visibleFrom", "visibleUntil"],
  SPACER: ["id", "type", "visible", "height", "visibleFrom", "visibleUntil"],
  EMBED: ["id", "type", "visible", "title", "url", "visibleFrom", "visibleUntil"],
  COUNTDOWN: ["id", "type", "visible", "title", "targetAt", "completionText", "alignment", "surface", "visibleFrom", "visibleUntil"],
} as const;

export function parseValidatedProfilePayload(
  profile: UnknownRecord,
  contentBlocks: unknown[],
  normalizedSlug: string,
): PersistedProfileData {
  const parsed: PersistedProfileData = {
    slug: normalizedSlug,
    displayName: (profile.displayName as string).trim(),
    username:
      typeof profile.username === "string" ? profile.username.trim() : undefined,
    bio: profile.bio as string,
    avatarUrl: optionalString(profile.avatarUrl),
    avatarAssetId: optionalString(profile.avatarAssetId),
    coverImageUrl: optionalString(profile.coverImageUrl),
    coverAssetId: optionalString(profile.coverAssetId),
    locationLabel:
      typeof profile.locationLabel === "string"
        ? profile.locationLabel.trim()
        : undefined,
    status: profile.status as PersistedProfileData["status"],
    stats: Array.isArray(profile.stats)
      ? profile.stats.map((stat) =>
          pickKnownFields(asRecord(stat), ["id", "value", "label", "visible"]),
        ) as NonNullable<PersistedProfileData["stats"]>
      : undefined,
    links: (profile.links as unknown[]).map(parseLink),
    socials: (profile.socials as unknown[]).map(parseSocial),
    contentBlocks: contentBlocks.map(parseContentBlock),
    engagement: parseEngagement(profile.engagement),
    appearance: parseAppearance(asRecord(profile.appearance)),
  };

  return parsed;
}

function parseAppearance(value: UnknownRecord): PersistedProfileData["appearance"] {
  const appearance = pickKnownFields(value, APPEARANCE_FIELDS);
  const page = optionalRecord(value.page);
  const hero = optionalRecord(value.hero);
  const identity = optionalRecord(value.identity);
  const cards = optionalRecord(value.cards);

  return {
    ...appearance,
    ...(page ? { page: pickKnownFields(page, PAGE_APPEARANCE_FIELDS) } : {}),
    ...(hero ? { hero: pickKnownFields(hero, HERO_APPEARANCE_FIELDS) } : {}),
    ...(identity
      ? { identity: pickKnownFields(identity, IDENTITY_APPEARANCE_FIELDS) }
      : {}),
    ...(cards ? { cards: pickKnownFields(cards, CARD_APPEARANCE_FIELDS) } : {}),
  } as PersistedProfileData["appearance"];
}

function parseLink(value: unknown): PersistedProfileLink {
  const link = asRecord(value);
  const parsed = pickKnownFields(link, LINK_FIELDS) as PersistedProfileLink;
  const customStyle = optionalRecord(link.customStyle);
  const availability = optionalRecord(link.availability);
  const sensitiveContent = optionalRecord(link.sensitiveContent);
  const geo = optionalRecord(link.geo);

  if (customStyle) {
    parsed.customStyle = pickKnownFields(
      customStyle,
      LINK_CUSTOM_STYLE_FIELDS,
    ) as NonNullable<PersistedProfileLink["customStyle"]>;
  }
  if (availability) {
    parsed.availability = pickKnownFields(availability, [
      "visibleFrom",
      "visibleUntil",
      "expiryAction",
    ]);
  }
  if (sensitiveContent) {
    parsed.sensitiveContent = pickKnownFields(
      sensitiveContent,
      ["enabled", "title", "message", "continueLabel"],
    ) as NonNullable<PersistedProfileLink["sensitiveContent"]>;
  }
  if (geo) parsed.geo = parseLinkGeo(geo);

  parsed.geoDestinations = (link.geoDestinations as unknown[]).map((destination) =>
    pickKnownFields(asRecord(destination), [
      "id",
      "countryCode",
      "countryName",
      "url",
    ]),
  ) as PersistedProfileLink["geoDestinations"];

  return parsed;
}

function parseLinkGeo(value: UnknownRecord): NonNullable<PersistedProfileLink["geo"]> {
  return {
    ...pickKnownFields(value, ["enabled", "fallback"]),
    rules: (value.rules as unknown[]).map((rawRule) => {
      const rule = asRecord(rawRule);
      const destination = optionalRecord(rule.destination);
      return {
        ...pickKnownFields(rule, [
          "id",
          "countryCode",
          "countryName",
          "action",
        ]),
        ...(destination ? { destination: parseDestination(destination) } : {}),
      };
    }),
  } as NonNullable<PersistedProfileLink["geo"]>;
}

function parseDestination(value: UnknownRecord) {
  const parsed = pickKnownFields(value, [
    "provider",
    "label",
    "value",
    "url",
    "fallbackUrl",
  ]);
  const deeplinkOverrides = optionalRecord(value.deeplinkOverrides);
  return {
    ...parsed,
    ...(deeplinkOverrides
      ? {
          deeplinkOverrides: pickKnownFields(deeplinkOverrides, [
            "android",
            "ios",
          ]),
        }
      : {}),
  };
}

function parseSocial(value: unknown): PersistedSocialLink {
  return pickKnownFields(asRecord(value), [
    "id",
    "name",
    "url",
    "visible",
    "platform",
  ]) as PersistedSocialLink;
}

function parseContentBlock(value: unknown): PageContentBlock {
  const block = asRecord(value);
  const type = block.type as keyof typeof CONTENT_BLOCK_FIELDS;
  const parsed = pickKnownFields(block, CONTENT_BLOCK_FIELDS[type]);

  if (type === "GALLERY") {
    parsed.images = (block.images as unknown[]).map((image) =>
      pickKnownFields(asRecord(image), [
        "id",
        "imageUrl",
        "imageAssetId",
        "alt",
      ]),
    );
  }

  return parsed as PageContentBlock;
}

function parseEngagement(
  value: unknown,
): PersistedProfileData["engagement"] {
  const engagement = optionalRecord(value);
  if (!engagement) return undefined;

  const parsed = pickKnownFields(engagement, ["featuredLinkId"]);
  const campaign = optionalRecord(engagement.campaign);
  const visitorMessaging = optionalRecord(engagement.visitorMessaging);

  return {
    ...parsed,
    ...(campaign
      ? {
          campaign: pickKnownFields(campaign, [
            "enabled",
            "primaryLinkId",
            "pinPrimary",
            "focusEffect",
            "dimSiblings",
            "focusColor",
            "visibleFrom",
            "visibleUntil",
          ]),
        }
      : {}),
    ...(visitorMessaging
      ? {
          visitorMessaging: pickKnownFields(visitorMessaging, [
            "activeIndicator",
            "responseTime",
            "customResponseTime",
          ]),
        }
      : {}),
  } as PersistedProfileData["engagement"];
}

function pickKnownFields(
  value: UnknownRecord,
  fields: readonly string[],
): UnknownRecord {
  const parsed: UnknownRecord = {};
  for (const field of fields) {
    if (value[field] !== undefined) parsed[field] = structuredClone(value[field]);
  }
  return parsed;
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function optionalRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function asRecord(value: unknown): UnknownRecord {
  return value as UnknownRecord;
}
