import type { ElementType } from "react";

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

/*
|--------------------------------------------------------------------------
| PLATFORMS
|--------------------------------------------------------------------------
*/

export type PlatformId =
    | "custom"
    | "website"
    | "instagram"
    | "tiktok"
    | "youtube"
    | "spotify"
    | "facebook"
    | "x"
    | "threads"
    | "twitch"
    | "discord"
    | "telegram"
    | "linkedin"
    | "github"
    | "soundcloud";

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

    /*
     * Frontend-only za sada.
     *
     * Kasnije u bazi čuvamo platform ID,
     * ne React komponentu.
     */
    icon?: ElementType;

    layout?: LinkCardLayout;

    aspectRatio?: LinkCardAspectRatio;

    /*
     * Media
     */
    imageUrl?: string;

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
     * Geo routing
     */
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

    icon: ElementType;
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

    sectionSpacing: number;
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

    /*
     * Typography
     */
    primaryTextColor: string;

    secondaryTextColor: string;

    fontFamily: string;

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
| PUBLIC PROFILE
|--------------------------------------------------------------------------
*/

export type PublicProfileData = {
    slug: string;

    displayName: string;

    username?: string;

    bio: string;

    avatarUrl?: string;

    coverImageUrl?: string;

    locationLabel?: string;

    status: ProfileStatus;

    stats?: ProfileStat[];

    links: PublicProfileLink[];

    socials: PublicSocialLink[];

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