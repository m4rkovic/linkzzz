import type { DestinationConfig } from "@/types/smart-link";

/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

export type ProfileStatus =
    | "DRAFT"
    | "PUBLISHED"
    | "DISABLED";

export type ProfileLayoutMode =
    | "classic"
    | "visual";

/*
|--------------------------------------------------------------------------
| CLASSIC APPEARANCE
|--------------------------------------------------------------------------
*/

export type ButtonStyle =
    | "filled"
    | "outline"
    | "glass";

export type BackgroundType =
    | "solid"
    | "gradient";

export type BackgroundEffect =
    | "none"
    | "soft-glow"
    | "mesh";

export type PageMobileColumns = 1 | 2;

/*
|--------------------------------------------------------------------------
| PLATFORMS
|--------------------------------------------------------------------------
*/

export type PlatformId =
    | "custom"
    | "website"
    | "store"
    | "instagram"
    | "tiktok"
    | "youtube"
    | "youtube-music"
    | "spotify"
    | "apple-music"
    | "soundcloud"
    | "bandcamp"
    | "facebook"
    | "x"
    | "threads"
    | "snapchat"
    | "twitch"
    | "discord"
    | "telegram"
    | "whatsapp"
    | "reddit"
    | "pinterest"
    | "linkedin"
    | "github"
    | "patreon"
    | "ko-fi"
    | "buy-me-a-coffee"
    | "email"
    | "phone";

/*
|--------------------------------------------------------------------------
| GEO ROUTING
|--------------------------------------------------------------------------
*/

export type GeoDestination = {
    id: string;

    countryCode: string;

    countryName: string;

    url: string;
};

export type LinkGeoRuleAction =
    | "SHOW"
    | "HIDE"
    | "REDIRECT";

export type LinkGeoRule = {
    id: string;

    countryCode: string;

    countryName: string;

    action: LinkGeoRuleAction;

    destination?: DestinationConfig;
};

export type LinkGeoFallback =
    | "SHOW"
    | "HIDE";

export type LinkGeoConfig = {
    enabled: boolean;

    fallback: LinkGeoFallback;

    rules: LinkGeoRule[];
};

/*
|--------------------------------------------------------------------------
| VISUAL LINK CARDS
|--------------------------------------------------------------------------
*/

export type LinkCardLayout =
    | "button"
    | "compact"
    | "half"
    | "full"
    | "featured";

export type LinkCardAspectRatio =
    | "auto"
    | "square"
    | "landscape"
    | "portrait"
    | "wide";

export type LinkImageFit =
    | "cover"
    | "contain";

export type LinkImagePosition =
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right";

export type LinkTitlePosition =
    | "bottom-left"
    | "bottom-center"
    | "center";

export type LinkCardBackgroundType =
    | "image"
    | "solid"
    | "gradient";

export type LinkPlatformBadgeStyle =
    | "circle"
    | "plain"
    | "none";

export type LinkPlatformBadgePosition =
    | "top-left"
    | "top-right";

export type LinkFocusEffect =
    | "none"
    | "glow"
    | "shake"
    | "glow-shake";

export type LinkCtaStyle =
    | "none"
    | "pill"
    | "solid"
    | "glass";

export type LinkExpiryAction =
    | "HIDE"
    | "DISABLE";

export type ScheduledVisibility = {
    visibleFrom?: string;
    visibleUntil?: string;
};

export type LinkAvailability = ScheduledVisibility & {
    expiryAction?: LinkExpiryAction;
};

export type LinkSensitiveContent = {
    enabled: boolean;
    title?: string;
    message?: string;
    continueLabel?: string;
};

export type ProfileActiveIndicatorMode =
    | "OFF"
    | "STATIC_ACTIVE";

export type ProfileResponseTimeMode =
    | "OFF"
    | "TEN_MINUTES"
    | "ONE_HOUR"
    | "CUSTOM";

export type ProfileVisitorMessaging = {
    activeIndicator?: ProfileActiveIndicatorMode;
    responseTime?: ProfileResponseTimeMode;
    customResponseTime?: string;
};

export type ProfileCampaign = ScheduledVisibility & {
    enabled: boolean;
    primaryLinkId?: string;
    pinPrimary?: boolean;
    focusEffect?: LinkFocusEffect;
    dimSiblings?: boolean;
    focusColor?: string;
};

export type ProfileEngagement = {
    /** Always pin this link first when no active campaign overrides it. */
    featuredLinkId?: string;
    campaign?: ProfileCampaign;
    visitorMessaging?: ProfileVisitorMessaging;
};

/*
|--------------------------------------------------------------------------
| PER-CARD CUSTOM STYLE
|--------------------------------------------------------------------------
|
| Ako enabled = false:
| kartica koristi global Appearance -> cards podešavanja.
|
| Ako enabled = true:
| ova kartica može potpuno zasebno da se stilizuje.
|
*/

export type LinkCardCustomStyle = {
    enabled: boolean;

    backgroundType?: LinkCardBackgroundType;

    backgroundColor?: string;

    gradientFrom?: string;

    gradientTo?: string;

    textColor?: string;

    borderColor?: string;

    borderRadius?: number;

    height?: number;

    borderWidth?: number;

    shadow?: number;

    overlayColor?: string;

    overlayOpacity?: number;

    platformBadgeStyle?: LinkPlatformBadgeStyle;

    platformBadgePosition?: LinkPlatformBadgePosition;

    platformBadgeBackgroundColor?: string;

    platformBadgeTextColor?: string;

    focusEffect?: LinkFocusEffect;

    dimSiblings?: boolean;

    focusColor?: string;

    focusDelayMs?: number;

    focusDurationMs?: number;

    focusOncePerSession?: boolean;

    badgeText?: string;

    badgeBackgroundColor?: string;

    badgeTextColor?: string;

    ctaText?: string;

    ctaStyle?: LinkCtaStyle;

    ctaBackgroundColor?: string;

    ctaTextColor?: string;

    titleSize?: number;

    descriptionSize?: number;

    descriptionColor?: string;

    contentPadding?: number;

    imageScale?: number;
};

/*
|--------------------------------------------------------------------------
| PUBLIC PROFILE LINK
|--------------------------------------------------------------------------
*/

export type PublicProfileLink = {
    id: string;

    title: string;

    description?: string;

    url: string;

    visible: boolean;

    platform?: PlatformId;

    layout?: LinkCardLayout;

    aspectRatio?: LinkCardAspectRatio;

    /*
     * Media
     */
    imageUrl?: string;

    imageAssetId?: string;

    imageAlt?: string;

    imageFit?: LinkImageFit;

    imagePosition?: LinkImagePosition;
    /*
     * Display
     */
    showPlatformIcon?: boolean;

    showTitle?: boolean;

    showDescription?: boolean;

    overlayEnabled?: boolean;

    overlayOpacity?: number;

    titlePosition?: LinkTitlePosition;

    /*
     * Per-card design override
     */
    customStyle?: LinkCardCustomStyle;

    /*
     * Scheduled availability
     */
    availability?: LinkAvailability;

    /*
     * Optional warning shown before the outbound resolver is allowed to continue.
     */
    sensitiveContent?: LinkSensitiveContent;

    /*
     * Per-card Geo behavior. New rules live here; geoDestinations is kept
     * as a compatibility mirror for older saved profiles.
     */
    geo?: LinkGeoConfig;

    geoDestinations: GeoDestination[];
};

/*
|--------------------------------------------------------------------------
| SOCIAL LINKS
|--------------------------------------------------------------------------
*/

export type PublicSocialLink = {
    id: string;

    name: string;

    url: string;

    visible: boolean;

    platform?: PlatformId;

};

/*
|--------------------------------------------------------------------------
| PROFILE STATS
|--------------------------------------------------------------------------
*/

export type ProfileStat = {
    id: string;

    value: string;

    label: string;

    visible: boolean;
};

/*
|--------------------------------------------------------------------------
| PAGE APPEARANCE
|--------------------------------------------------------------------------
*/

export type PageAppearance = {
    maxWidth: number;

    horizontalPadding: number;

    mobileHorizontalPadding: number;

    sectionSpacing: number;

    mobileSectionSpacing: number;

    verticalPadding: number;

    mobileColumns: PageMobileColumns;

    sectionBackgroundColor: string;

    sectionBorderColor: string;

    sectionSurfaceOpacity: number;
};

/*
|--------------------------------------------------------------------------
| HERO
|--------------------------------------------------------------------------
*/

export type HeroContentPosition =
    | "bottom-left"
    | "bottom-center"
    | "below";

export type HeroAppearance = {
    enabled: boolean;

    height: number;

    overlayEnabled: boolean;

    overlayColor: string;

    overlayOpacity: number;

    imageFit: LinkImageFit;

    imagePosition?: LinkImagePosition;

    /*
     * Existing compatibility.
     */
    profilePosition:
    | "over-hero"
    | "below-hero";

    /*
     * New visual composition.
     */
    fullBleed: boolean;

    contentPosition: HeroContentPosition;

    avatarOverlap: number;

    showAvatar: boolean;

    showName: boolean;

    showUsername: boolean;

    showBio: boolean;

    showSocials: boolean;

    showLocation: boolean;

    showStats: boolean;

    heroTextColor: string;

    heroSecondaryTextColor: string;
};

/*
|--------------------------------------------------------------------------
| PROFILE IDENTITY
|--------------------------------------------------------------------------
*/

export type AvatarShape =
    | "circle"
    | "rounded"
    | "square";

export type ProfileTextAlignment =
    | "left"
    | "center";

export type SocialIconStyle =
    | "plain"
    | "circle"
    | "square";

export type IdentityAppearance = {
    alignment: ProfileTextAlignment;

    avatarSize: number;

    avatarShape: AvatarShape;

    nameSize: number;

    bioMaxWidth: number;

    socialIconSize: number;

    socialIconStyle: SocialIconStyle;

    showLocation: boolean;

    showStats: boolean;
};

/*
|--------------------------------------------------------------------------
| GLOBAL CARD APPEARANCE
|--------------------------------------------------------------------------
*/

export type CardHoverEffect =
    | "none"
    | "lift"
    | "scale"
    | "glow";

export type CardAppearance = {
    defaultLayout: LinkCardLayout;

    borderRadius: number;

    spacing: number;

    cardHeight: number;

    featuredHeight: number;

    imageFit: LinkImageFit;

    overlayColor: string;

    overlayOpacity: number;

    titlePosition: LinkTitlePosition;

    titleSize: number;

    borderWidth: number;

    shadow: number;

    hoverEffect: CardHoverEffect;
};

/*
|--------------------------------------------------------------------------
| PROFILE APPEARANCE
|--------------------------------------------------------------------------
*/

export type ProfileAppearance = {
    /*
     * classic = original Linkzzz
     * visual  = creator/card builder
     */
    layoutMode?: ProfileLayoutMode;

    /*
     * Page background
     */
    backgroundType: BackgroundType;

    backgroundColor: string;

    gradientFrom: string;

    gradientTo: string;

    gradientAngle?: number;

    backgroundEffect?: BackgroundEffect;

    backgroundEffectColor?: string;

    backgroundEffectIntensity?: number;

    /*
     * Typography
     */
    primaryTextColor: string;

    secondaryTextColor: string;

    fontFamily: string;

    headingWeight?: 600 | 700 | 800 | 900;

    headingLetterSpacing?: number;

    /*
     * Classic button system
     */
    buttonStyle: ButtonStyle;

    buttonBackgroundColor: string;

    buttonTextColor: string;

    buttonBorderColor: string;

    borderRadius: number;

    buttonSpacing: number;

    shadow: number;

    /*
     * Visual mode
     */
    page?: PageAppearance;

    hero?: HeroAppearance;

    identity?: IdentityAppearance;

    cards?: CardAppearance;
};

/*
|--------------------------------------------------------------------------
| PAGE CONTENT BLOCKS
|--------------------------------------------------------------------------
*/

export type PageBlockAlignment = "left" | "center";

export type PageBlockGalleryImage = {
    id: string;
    imageUrl?: string;
    imageAssetId?: string;
    alt?: string;
};

export type PageContentBlock = (
    | {
        id: string;
        type: "TEXT";
        visible: boolean;
        heading?: string;
        body: string;
        alignment: PageBlockAlignment;
        surface: "plain" | "card";
      }
    | {
        id: string;
        type: "CTA";
        visible: boolean;
        title: string;
        description?: string;
        buttonText: string;
        url: string;
        alignment: PageBlockAlignment;
        style: "solid" | "outline" | "glass";
      }
    | {
        id: string;
        type: "EMAIL_CAPTURE";
        visible: boolean;
        title: string;
        description?: string;
        placeholder: string;
        buttonText: string;
        successMessage: string;
      }
    | {
        id: string;
        type: "GALLERY";
        visible: boolean;
        title?: string;
        columns: 2 | 3 | 4;
        aspectRatio: "square" | "portrait" | "landscape";
        images: PageBlockGalleryImage[];
      }
    | {
        id: string;
        type: "DIVIDER";
        visible: boolean;
        style: "solid" | "faded";
        thickness: number;
      }
    | {
        id: string;
        type: "SPACER";
        visible: boolean;
        height: number;
      }
    | {
        id: string;
        type: "EMBED";
        visible: boolean;
        title?: string;
        url: string;
      }
    | {
        id: string;
        type: "COUNTDOWN";
        visible: boolean;
        title: string;
        targetAt: string;
        completionText: string;
        alignment: PageBlockAlignment;
        surface: "plain" | "card";
      }
) & ScheduledVisibility;

/*
|--------------------------------------------------------------------------
| PUBLIC PROFILE
|--------------------------------------------------------------------------
*/

export type PublicProfileData = {
    slug: string;

    displayName: string;

    username?: string;

    bio: string;

    avatarUrl?: string;

    avatarAssetId?: string;

    coverImageUrl?: string;

    coverAssetId?: string;

    locationLabel?: string;

    status: ProfileStatus;

    stats?: ProfileStat[];

    links: PublicProfileLink[];

    socials: PublicSocialLink[];

    contentBlocks: PageContentBlock[];

    engagement?: ProfileEngagement;

    appearance: ProfileAppearance;
};

/*
|--------------------------------------------------------------------------
| VISITOR
|--------------------------------------------------------------------------
*/

export type VisitorLocation = {
    countryCode: string;

    countryName: string;

    flag: string;
};
