import type { LinkCardCustomStyle, LinkCardLayout, PublicProfileData, PublicProfileLink } from "@/types/profile";
import type { CardStyleDraft, LinkDraft } from "@/features/links/link-editor-types";
import { detectPlatform, getPlatformIcon } from "@/config/platforms";

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
    geoDestinations: [],
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
    },
    geoDestinations: link.geoDestinations ?? [],
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
    icon: getPlatformIcon(draft.platform),
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
    geoDestinations: draft.geoDestinations,
  };
}

export function applyDraftToLink(link: PublicProfileLink, draft: LinkDraft): PublicProfileLink {
  return {
    ...link,
    title: draft.title,
    description: draft.description || undefined,
    url: draft.url,
    platform: draft.platform,
    icon: getPlatformIcon(draft.platform),
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
    geoDestinations: draft.geoDestinations,
  };
}

export function normalizeDraft(draft: LinkDraft): LinkDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    url: normalizeUrl(draft.url),
    geoDestinations: draft.geoDestinations.map((destination) => ({ ...destination, url: normalizeUrl(destination.url) })),
  };
}

export function validateDraft(draft: LinkDraft) {
  if (!draft.title.trim()) return "Link title is required.";
  if (!draft.url.trim()) return "Default URL is required.";
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

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
