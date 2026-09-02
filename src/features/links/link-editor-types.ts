import type {
  LinkGeoConfig,
  LinkCardAspectRatio,
  LinkCardBackgroundType,
  LinkCardLayout,
  LinkCtaStyle,
  LinkImageFit,
  LinkImagePosition,
  LinkFocusEffect,
  LinkAvailability,
  LinkSensitiveContent,
  LinkPlatformBadgePosition,
  LinkPlatformBadgeStyle,
  LinkTitlePosition,
  PlatformId,
} from "@/types/profile";

export type CardStyleDraft = {
  enabled: boolean;
  backgroundType: LinkCardBackgroundType;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  borderColor: string;
  borderRadius: number;
  height: number;
  borderWidth: number;
  shadow: number;
  overlayColor: string;
  overlayOpacity: number;
  platformBadgeStyle: LinkPlatformBadgeStyle;
  platformBadgePosition: LinkPlatformBadgePosition;
  platformBadgeBackgroundColor: string;
  platformBadgeTextColor: string;
  focusEffect: LinkFocusEffect;
  dimSiblings: boolean;
  focusColor: string;
  focusDelayMs: number;
  focusDurationMs: number;
  focusOncePerSession: boolean;
  badgeText: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  ctaText: string;
  ctaStyle: LinkCtaStyle;
  ctaBackgroundColor: string;
  ctaTextColor: string;
  titleSize: number;
  descriptionSize: number;
  descriptionColor: string;
  contentPadding: number;
  imageScale: number;
};

export type LinkDraft = {
  title: string;
  description: string;
  url: string;
  platform: PlatformId;
  layout: LinkCardLayout;
  aspectRatio: LinkCardAspectRatio;
  imageUrl: string;
  imageAlt: string;
  imageFit: LinkImageFit;
  imagePosition: LinkImagePosition;
  showPlatformIcon: boolean;
  showTitle: boolean;
  showDescription: boolean;
  overlayEnabled: boolean;
  overlayOpacity: number;
  titlePosition: LinkTitlePosition;
  customStyle: CardStyleDraft;
  availability: LinkAvailability;
  sensitiveContent: LinkSensitiveContent;
  geo: LinkGeoConfig;
};
