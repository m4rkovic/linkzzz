import type { LinkCardCustomStyle, LinkCardLayout, PublicProfileData, PublicProfileLink } from "@/types/profile";
import type { CardStyleDraft, LinkDraft } from "@/features/links/link-editor-types";
import { detectPlatform, platformToProviderId } from "@/config/platforms";
import { normalizeProviderDestination } from "@/features/destinations/provider-registry";
import { validateLinkAvailability } from "@/features/links/link-availability";
import { DEFAULT_SENSITIVE_CONTENT_WARNING } from "@/features/links/sensitive-content";
import {
  DEFAULT_LINK_GEO_CONFIG,
  effectiveLinkGeo,
  linkGeoToLegacyDestinations,
} from "@/features/links/link-geo";
import {
  normalizeLinkGeoConfig,
  validateLinkGeoConfig,
} from "@/features/links/link-geo-editor";

export function createDefaultCardStyle(layout: LinkCardLayout): CardStyleDraft {
  let height = 220;
  if (layout === "compact") height = 130;
  if (layout === "half") height = 190;
  if (layout === "featured") height = 340;

  return {
    enabled: false,
    backgroundType: "image",
    backgroundColor: "#18181b",
    gradientFrom: "#18181b",
    gradientTo: "#3f3f46",
    textColor: "#ffffff",
    borderColor: "#ffffff",
    borderRadius: 20,
    height,
    borderWidth: 0,
    shadow: 2,
    overlayColor: "#000000",
    overlayOpacity: 0.4,
    platformBadgeStyle: "circle",
    platformBadgePosition: "top-left",
    platformBadgeBackgroundColor: "#ffffff",
    platformBadgeTextColor: "#09090b",
    focusEffect: "none",
    dimSiblings: true,
    focusColor: "#ffffff",
    focusDelayMs: 500,
    focusDurationMs: 4500,
    focusOncePerSession: false,
    badgeText: "",
    badgeBackgroundColor: "#ffffff",
    badgeTextColor: "#09090b",
    ctaText: "",
    ctaStyle: "none",
    ctaBackgroundColor: "#ffffff",
    ctaTextColor: "#09090b",
    titleSize: 22,
    descriptionSize: 13,
    descriptionColor: "#ffffff",
    contentPadding: 20,
    imageScale: 100,
  };
}

export function createEmptyDraft(layout: LinkCardLayout): LinkDraft {
  return {
    title: "",
    description: "",
    url: "",
    platform: "custom",
    layout,
    aspectRatio: "auto",
    imageUrl: "",
    imageAlt: "",
    imageFit: "cover",
    imagePosition: "center",
    showPlatformIcon: true,
    showTitle: true,
    showDescription: false,
    overlayEnabled: true,
    overlayOpacity: 0.42,
    titlePosition: "bottom-center",
    customStyle: createDefaultCardStyle(layout),
    availability: { expiryAction: "HIDE" },
    sensitiveContent: { ...DEFAULT_SENSITIVE_CONTENT_WARNING },
    geo: structuredClone(DEFAULT_LINK_GEO_CONFIG),
  };
}

export function linkToDraft(link: PublicProfileLink, profile: PublicProfileData): LinkDraft {
  const layout = link.layout ?? "button";
  const globalCards = profile.appearance.cards;
  const defaultStyle = createDefaultCardStyle(layout);

  return {
    title: link.title,
    description: link.description ?? "",
    url: link.url,
    platform: link.platform ?? detectPlatform(link.url),
    layout,
    aspectRatio: link.aspectRatio ?? "auto",
    imageUrl: link.imageUrl ?? "",
    imageAlt: link.imageAlt ?? "",
    imageFit: link.imageFit ?? globalCards?.imageFit ?? "cover",
    imagePosition: link.imagePosition ?? "center",
    showPlatformIcon: link.showPlatformIcon ?? true,
    showTitle: link.showTitle ?? true,
    showDescription: link.showDescription ?? false,
    overlayEnabled: link.overlayEnabled ?? true,
    overlayOpacity: link.overlayOpacity ?? globalCards?.overlayOpacity ?? 0.42,
    titlePosition: link.titlePosition ?? globalCards?.titlePosition ?? "bottom-center",
    customStyle: {
      ...defaultStyle,
      enabled: link.customStyle?.enabled ?? false,
      backgroundType: link.customStyle?.backgroundType ?? defaultStyle.backgroundType,
      backgroundColor: link.customStyle?.backgroundColor ?? profile.appearance.buttonBackgroundColor,
      gradientFrom: link.customStyle?.gradientFrom ?? profile.appearance.gradientFrom,
      gradientTo: link.customStyle?.gradientTo ?? profile.appearance.gradientTo,
      textColor: link.customStyle?.textColor ?? profile.appearance.primaryTextColor,
      borderColor: link.customStyle?.borderColor ?? profile.appearance.buttonBorderColor,
      borderRadius: link.customStyle?.borderRadius ?? globalCards?.borderRadius ?? defaultStyle.borderRadius,
      height: link.customStyle?.height ?? getDefaultHeight(layout, profile),
      borderWidth: link.customStyle?.borderWidth ?? globalCards?.borderWidth ?? 0,
      shadow: link.customStyle?.shadow ?? globalCards?.shadow ?? 2,
      overlayColor: link.customStyle?.overlayColor ?? globalCards?.overlayColor ?? "#000000",
      overlayOpacity: link.customStyle?.overlayOpacity ?? link.overlayOpacity ?? globalCards?.overlayOpacity ?? 0.42,
      platformBadgeStyle: link.customStyle?.platformBadgeStyle ?? "circle",
      platformBadgePosition: link.customStyle?.platformBadgePosition ?? "top-left",
      platformBadgeBackgroundColor: link.customStyle?.platformBadgeBackgroundColor ?? "#ffffff",
      platformBadgeTextColor: link.customStyle?.platformBadgeTextColor ?? "#09090b",
      focusEffect: link.customStyle?.focusEffect ?? "none",
      dimSiblings: link.customStyle?.dimSiblings ?? true,
      focusColor: link.customStyle?.focusColor ?? "#ffffff",
      focusDelayMs: link.customStyle?.focusDelayMs ?? 500,
      focusDurationMs: link.customStyle?.focusDurationMs ?? 4500,
      focusOncePerSession: link.customStyle?.focusOncePerSession ?? false,
      badgeText: link.customStyle?.badgeText ?? "",
      badgeBackgroundColor: link.customStyle?.badgeBackgroundColor ?? "#ffffff",
      badgeTextColor: link.customStyle?.badgeTextColor ?? "#09090b",
      ctaText: link.customStyle?.ctaText ?? "",
      ctaStyle: link.customStyle?.ctaStyle ?? "none",
      ctaBackgroundColor: link.customStyle?.ctaBackgroundColor ?? "#ffffff",
      ctaTextColor: link.customStyle?.ctaTextColor ?? "#09090b",
      titleSize: link.customStyle?.titleSize ?? (layout === "featured" ? 28 : 22),
      descriptionSize: link.customStyle?.descriptionSize ?? 13,
      descriptionColor: link.customStyle?.descriptionColor ?? "#ffffff",
      contentPadding: link.customStyle?.contentPadding ?? 20,
      imageScale: link.customStyle?.imageScale ?? 100,
    },
    availability: {
      visibleFrom: link.availability?.visibleFrom,
      visibleUntil: link.availability?.visibleUntil,
      expiryAction: link.availability?.expiryAction ?? "HIDE",
    },
    sensitiveContent: {
      ...DEFAULT_SENSITIVE_CONTENT_WARNING,
      ...(link.sensitiveContent ?? {}),
    },
    geo: effectiveLinkGeo(link.geo, link.geoDestinations),
  };
}

export function createLinkFromDraft(id: string, draft: LinkDraft): PublicProfileLink {
  return {
    id,
    title: draft.title,
    description: draft.description || undefined,
    url: draft.url,
    visible: true,
    platform: draft.platform,
    layout: draft.layout,
    aspectRatio: draft.aspectRatio,
    imageUrl: draft.imageUrl || undefined,
    imageAlt: draft.imageAlt || undefined,
    imageFit: draft.imageFit,
    imagePosition: draft.imagePosition,
    showPlatformIcon: draft.showPlatformIcon,
    showTitle: draft.showTitle,
    showDescription: draft.showDescription,
    overlayEnabled: draft.overlayEnabled,
    overlayOpacity: draft.overlayOpacity,
    titlePosition: draft.titlePosition,
    customStyle: cardStyleToModel(draft.customStyle),
    availability: normalizeAvailability(draft.availability),
    sensitiveContent: normalizeSensitiveContent(draft.sensitiveContent),
    geo: normalizeLinkGeoConfig(draft.geo),
    geoDestinations: linkGeoToLegacyDestinations(normalizeLinkGeoConfig(draft.geo)),
  };
}

export function applyDraftToLink(link: PublicProfileLink, draft: LinkDraft): PublicProfileLink {
  return {
    ...link,
    title: draft.title,
    description: draft.description || undefined,
    url: draft.url,
    platform: draft.platform,
    layout: draft.layout,
    aspectRatio: draft.aspectRatio,
    imageUrl: draft.imageUrl || undefined,
    imageAlt: draft.imageAlt || undefined,
    imageFit: draft.imageFit,
    imagePosition: draft.imagePosition,
    showPlatformIcon: draft.showPlatformIcon,
    showTitle: draft.showTitle,
    showDescription: draft.showDescription,
    overlayEnabled: draft.overlayEnabled,
    overlayOpacity: draft.overlayOpacity,
    titlePosition: draft.titlePosition,
    customStyle: cardStyleToModel(draft.customStyle),
    availability: normalizeAvailability(draft.availability),
    sensitiveContent: normalizeSensitiveContent(draft.sensitiveContent),
    geo: normalizeLinkGeoConfig(draft.geo),
    geoDestinations: linkGeoToLegacyDestinations(normalizeLinkGeoConfig(draft.geo)),
  };
}

export function normalizeDraft(draft: LinkDraft): LinkDraft {
  const destination = normalizeProviderDestination(platformToProviderId(draft.platform), draft.url);
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    url: destination.ok ? destination.value.url : draft.url.trim(),
    sensitiveContent: {
      ...draft.sensitiveContent,
      title: draft.sensitiveContent.title?.trim(),
      message: draft.sensitiveContent.message?.trim(),
      continueLabel: draft.sensitiveContent.continueLabel?.trim(),
    },
    geo: normalizeLinkGeoConfig(draft.geo),
  };
}

export function validateDraft(draft: LinkDraft) {
  if (!draft.title.trim()) return "Link title is required.";
  if (!draft.url.trim()) return "Default destination is required.";
  const destination = normalizeProviderDestination(platformToProviderId(draft.platform), draft.url);
  if (!destination.ok) return destination.error;
  const availabilityError = validateLinkAvailability(draft.availability);
  if (availabilityError) return availabilityError;
  const geoError = validateLinkGeoConfig(draft.geo);
  if (geoError) return geoError;
  if (draft.sensitiveContent.enabled) {
    const title = draft.sensitiveContent.title?.trim() ?? "";
    const message = draft.sensitiveContent.message?.trim() ?? "";
    const continueLabel = draft.sensitiveContent.continueLabel?.trim() ?? "";
    if (!title || title.length > 80) return "Sensitive-content title must contain 1 to 80 characters.";
    if (!message || message.length > 300) return "Sensitive-content message must contain 1 to 300 characters.";
    if (!continueLabel || continueLabel.length > 40) return "Sensitive-content continue label must contain 1 to 40 characters.";
  }
  return "";
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function revokeDraftBlobIfDisposable(imageUrl: string, protectedImageUrl?: string) {
  if (!imageUrl.startsWith("blob:") || imageUrl === protectedImageUrl) return;
  URL.revokeObjectURL(imageUrl);
}

export function revokeUnsavedImage(draft: LinkDraft, editingId: string | null, links: PublicProfileLink[]) {
  if (!draft.imageUrl.startsWith("blob:")) return;
  if (editingId) {
    const original = links.find((link) => link.id === editingId);
    if (original?.imageUrl === draft.imageUrl) return;
  }
  URL.revokeObjectURL(draft.imageUrl);
}

function cardStyleToModel(style: CardStyleDraft): LinkCardCustomStyle {
  return { ...style };
}

function getDefaultHeight(layout: LinkCardLayout, profile: PublicProfileData) {
  const cards = profile.appearance.cards;
  if (layout === "featured") return cards?.featuredHeight ?? 340;
  if (layout === "half") return 190;
  if (layout === "compact") return 130;
  return cards?.cardHeight ?? 220;
}

function normalizeAvailability(availability: LinkDraft["availability"]) {
  const visibleFrom = availability.visibleFrom || undefined;
  const visibleUntil = availability.visibleUntil || undefined;
  if (!visibleFrom && !visibleUntil) return undefined;
  return {
    visibleFrom,
    visibleUntil,
    expiryAction: availability.expiryAction ?? "HIDE",
  };
}


function normalizeSensitiveContent(value: LinkDraft["sensitiveContent"]) {
  if (!value.enabled) return undefined;
  return {
    enabled: true,
    title: value.title?.trim() || DEFAULT_SENSITIVE_CONTENT_WARNING.title,
    message: value.message?.trim() || DEFAULT_SENSITIVE_CONTENT_WARNING.message,
    continueLabel: value.continueLabel?.trim() || DEFAULT_SENSITIVE_CONTENT_WARNING.continueLabel,
  };
}
