"use client";

import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react";

import {
    ExternalLink,
    MapPin,
    Share2,
} from "lucide-react";

import VisualStickyHeader from "@/components/public/visual-sticky-header";

import type {
    LinkCardAspectRatio,
    LinkCardBackgroundType,
    LinkCardLayout,
    LinkPlatformBadgePosition,
    LinkPlatformBadgeStyle,
    LinkTitlePosition,
    PublicProfileData,
    PublicProfileLink,
    VisitorLocation,
} from "@/types/profile";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type ProfileRendererProps = {
    profile: PublicProfileData;

    visitor?: VisitorLocation;

    mode?: "public" | "preview";

    onShare?: () => void;

    onLinkClick?: (
        linkId: string,
    ) => void;

    onSocialClick?: (
        socialId: string,
    ) => void;
};

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

export default function ProfileRenderer({
    profile,
    visitor,
    mode = "public",
    onShare,
    onLinkClick,
    onSocialClick,
}: ProfileRendererProps) {
    const isPreview =
        mode === "preview";

    if (
        !isPreview &&
        profile.status !== "PUBLISHED"
    ) {
        return (
            <UnavailableProfile
                status={profile.status}
            />
        );
    }

    const layoutMode =
        profile.appearance.layoutMode ??
        "classic";

    if (layoutMode === "visual") {
        return (
            <VisualProfileRenderer
                profile={profile}
                visitor={visitor}
                isPreview={isPreview}
                onShare={onShare}
                onLinkClick={onLinkClick}
                onSocialClick={
                    onSocialClick
                }
            />
        );
    }

    return (
        <ClassicProfileRenderer
            profile={profile}
            visitor={visitor}
            isPreview={isPreview}
            onShare={onShare}
            onLinkClick={onLinkClick}
            onSocialClick={
                onSocialClick
            }
        />
    );
}

/*
|--------------------------------------------------------------------------
| CLASSIC PROFILE
|--------------------------------------------------------------------------
*/

function ClassicProfileRenderer({
    profile,
    visitor,
    isPreview,
    onShare,
    onLinkClick,
    onSocialClick,
}: {
    profile: PublicProfileData;

    visitor?: VisitorLocation;

    isPreview: boolean;

    onShare?: () => void;

    onLinkClick?: (
        linkId: string,
    ) => void;

    onSocialClick?: (
        socialId: string,
    ) => void;
}) {
    const appearance =
        profile.appearance;

    return (
        <div
            className={`relative w-full overflow-hidden ${isPreview
                ? "min-h-full"
                : "min-h-screen"
                }`}
            style={{
                background:
                    getPageBackground(
                        profile,
                    ),

                color:
                    appearance.primaryTextColor,

                fontFamily:
                    appearance.fontFamily,
            }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
            >
                <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-white/[0.035] blur-3xl" />

                <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-white/[0.025] blur-3xl" />
            </div>

            <div
                className={`relative mx-auto flex w-full max-w-6xl flex-col ${isPreview
                    ? "min-h-full px-4 py-4"
                    : "min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-10"
                    }`}
            >
                <ProfileTopBar
                    profile={profile}
                    visitor={visitor}
                    isPreview={isPreview}
                    onShare={onShare}
                />

                <div
                    className={`mx-auto flex w-full max-w-xl flex-1 flex-col justify-center ${isPreview
                        ? "py-7"
                        : "py-10 sm:py-14"
                        }`}
                >
                    <header className="text-center">
                        <ClassicAvatar
                            profile={profile}
                            isPreview={
                                isPreview
                            }
                        />

                        <h1
                            className={`font-black tracking-tight ${isPreview
                                ? "mt-4 text-xl"
                                : "mt-5 text-2xl sm:text-3xl"
                                }`}
                        >
                            {
                                profile.displayName
                            }
                        </h1>

                        {profile.bio && (
                            <p
                                className={`mx-auto max-w-md leading-6 ${isPreview
                                    ? "mt-2 text-xs"
                                    : "mt-3 text-sm sm:text-base"
                                    }`}
                                style={{
                                    color:
                                        appearance.secondaryTextColor,
                                }}
                            >
                                {profile.bio}
                            </p>
                        )}

                        {profile.locationLabel && (
                            <div
                                className="mt-4 flex items-center justify-center gap-2 text-xs"
                                style={{
                                    color:
                                        appearance.secondaryTextColor,
                                }}
                            >
                                <MapPin
                                    size={13}
                                />

                                {
                                    profile.locationLabel
                                }
                            </div>
                        )}
                    </header>

                    <SocialLinks
                        profile={profile}
                        isPreview={
                            isPreview
                        }
                        mode="classic"
                        onSocialClick={
                            onSocialClick
                        }
                    />

                    <div
                        className="mt-8"
                        style={{
                            display: "grid",

                            gap: `${appearance.buttonSpacing}px`,
                        }}
                    >
                        {profile.links
                            .filter(
                                (link) =>
                                    link.visible,
                            )
                            .map(
                                (link) => (
                                    <ClassicLinkButton
                                        key={
                                            link.id
                                        }
                                        profile={
                                            profile
                                        }
                                        link={link}
                                        visitor={
                                            visitor
                                        }
                                        isPreview={
                                            isPreview
                                        }
                                        onClick={() =>
                                            onLinkClick?.(
                                                link.id,
                                            )
                                        }
                                    />
                                ),
                            )}
                    </div>
                </div>

                <LinkzzzFooter
                    profile={profile}
                    isPreview={isPreview}
                />
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| VISUAL PROFILE
|--------------------------------------------------------------------------
*/

function VisualProfileRenderer({
    profile,
    visitor,
    isPreview,
    onShare,
    onLinkClick,
    onSocialClick,
}: {
    profile: PublicProfileData;

    visitor?: VisitorLocation;

    isPreview: boolean;

    onShare?: () => void;

    onLinkClick?: (
        linkId: string,
    ) => void;

    onSocialClick?: (
        socialId: string,
    ) => void;
}) {
    const identityRef =
        useRef<HTMLDivElement>(
            null,
        );

    const appearance =
        profile.appearance;

    const page =
        appearance.page;

    const hero =
        appearance.hero;

    const identity =
        appearance.identity;

    const cards =
        appearance.cards;

    const maxWidth =
        page?.maxWidth ??
        760;

    const horizontalPadding =
        page?.horizontalPadding ??
        20;

    const sectionSpacing =
        page?.sectionSpacing ??
        20;

    const heroEnabled =
        hero?.enabled ??
        false;

    const contentPosition =
        hero?.contentPosition ??
        (hero?.profilePosition ===
            "below-hero"
            ? "below"
            : "bottom-center");

    const identityInsideHero =
        heroEnabled &&
        contentPosition !==
        "below";

    const showAvatar =
        heroEnabled
            ? hero?.showAvatar ??
            true
            : true;

    const showName =
        heroEnabled
            ? hero?.showName ??
            true
            : true;

    const showUsername =
        heroEnabled
            ? hero?.showUsername ??
            true
            : true;

    const showBio =
        heroEnabled
            ? hero?.showBio ??
            true
            : true;

    const showLocation =
        heroEnabled
            ? hero?.showLocation ??
            true
            : identity?.showLocation ??
            true;

    const showSocials =
        heroEnabled
            ? hero?.showSocials ??
            true
            : true;

    const showStats =
        heroEnabled
            ? hero?.showStats ??
            true
            : identity?.showStats ??
            true;

    const heroPrimary =
        hero?.heroTextColor ??
        "#ffffff";

    const heroSecondary =
        hero?.heroSecondaryTextColor ??
        "#d4d4d8";

    const cardGap =
        cards?.spacing ??
        12;

    return (
        <div
            className={`relative w-full ${isPreview
                ? "min-h-full"
                : "min-h-screen"
                }`}
            style={{
                background:
                    getPageBackground(
                        profile,
                    ),

                color:
                    appearance.primaryTextColor,

                fontFamily:
                    appearance.fontFamily,
            }}
        >
            <div
                className="relative mx-auto w-full"
                style={{
                    maxWidth: `${maxWidth}px`,
                }}
            >
                <VisualStickyHeader
                    profile={profile}
                    identityRef={
                        identityRef
                    }
                    isPreview={
                        isPreview
                    }
                    onShare={onShare}
                />

                {/* HERO */}
                {heroEnabled && (
                    <VisualHero
                        profile={profile}
                        isPreview={isPreview}
                        horizontalPadding={
                            horizontalPadding
                        }
                    >
                        {identityInsideHero && (
                            <div
                                ref={identityRef}
                                className={`absolute inset-x-0 z-20 ${isPreview
                                    ? "bottom-4"
                                    : "bottom-6"
                                    }`}
                                style={{
                                    paddingLeft: `${horizontalPadding +
                                        (isPreview
                                            ? 2
                                            : 4)
                                        }px`,

                                    paddingRight: `${horizontalPadding +
                                        (isPreview
                                            ? 2
                                            : 4)
                                        }px`,
                                }}
                            >
                                <VisualIdentity
                                    profile={profile}
                                    isPreview={
                                        isPreview
                                    }
                                    heroEnabled
                                    alignmentOverride={
                                        contentPosition ===
                                            "bottom-left"
                                            ? "left"
                                            : "center"
                                    }
                                    primaryColor={
                                        heroPrimary
                                    }
                                    secondaryColor={
                                        heroSecondary
                                    }
                                    showAvatar={
                                        showAvatar
                                    }
                                    showName={
                                        showName
                                    }
                                    showUsername={
                                        showUsername
                                    }
                                    showBio={
                                        showBio
                                    }
                                    showLocation={
                                        showLocation
                                    }
                                />

                                {showSocials && (
                                    <SocialLinks
                                        profile={
                                            profile
                                        }
                                        isPreview={
                                            isPreview
                                        }
                                        mode="visual"
                                        alignmentOverride={
                                            contentPosition ===
                                                "bottom-left"
                                                ? "left"
                                                : "center"
                                        }
                                        colorOverride={
                                            heroPrimary
                                        }
                                        onSocialClick={
                                            onSocialClick
                                        }
                                    />
                                )}

                                {showStats && (
                                    <ProfileStats
                                        profile={
                                            profile
                                        }
                                        isPreview={
                                            isPreview
                                        }
                                        primaryColor={
                                            heroPrimary
                                        }
                                        secondaryColor={
                                            heroSecondary
                                        }
                                        alignment={
                                            contentPosition ===
                                                "bottom-left"
                                                ? "left"
                                                : "center"
                                        }
                                    />
                                )}
                            </div>
                        )}
                    </VisualHero>
                )}

                {/* TOP BAR */}
                <div
                    className={
                        heroEnabled
                            ? "absolute left-0 right-0 top-0 z-30"
                            : "relative z-30"
                    }
                    style={{
                        paddingLeft: `${horizontalPadding}px`,

                        paddingRight: `${horizontalPadding}px`,
                    }}
                >
                    <div
                        className={
                            isPreview
                                ? "pt-3"
                                : "pt-4 sm:pt-5"
                        }
                    >
                        <ProfileTopBar
                            profile={profile}
                            visitor={visitor}
                            isPreview={
                                isPreview
                            }
                            onShare={onShare}
                            visual={
                                heroEnabled
                            }
                        />
                    </div>
                </div>

                <main
                    style={{
                        paddingLeft: `${horizontalPadding}px`,

                        paddingRight: `${horizontalPadding}px`,

                        paddingBottom:
                            isPreview
                                ? "20px"
                                : "36px",
                    }}
                >
                    {/* IDENTITY BELOW HERO */}
                    {!identityInsideHero && (
                        <div
                            ref={identityRef}
                            className="relative z-20"
                            style={{
                                marginTop:
                                    heroEnabled
                                        ? `-${Math.min(
                                            hero?.avatarOverlap ??
                                            44,
                                            100,
                                        )}px`
                                        : isPreview
                                            ? "28px"
                                            : "36px",
                            }}
                        >
                            <VisualIdentity
                                profile={profile}
                                isPreview={
                                    isPreview
                                }
                                heroEnabled={
                                    heroEnabled
                                }
                                primaryColor={
                                    appearance.primaryTextColor
                                }
                                secondaryColor={
                                    appearance.secondaryTextColor
                                }
                                showAvatar={
                                    showAvatar
                                }
                                showName={
                                    showName
                                }
                                showUsername={
                                    showUsername
                                }
                                showBio={
                                    showBio
                                }
                                showLocation={
                                    showLocation
                                }
                            />

                            {showSocials && (
                                <SocialLinks
                                    profile={
                                        profile
                                    }
                                    isPreview={
                                        isPreview
                                    }
                                    mode="visual"
                                    colorOverride={
                                        appearance.primaryTextColor
                                    }
                                    onSocialClick={
                                        onSocialClick
                                    }
                                />
                            )}

                            {showStats && (
                                <ProfileStats
                                    profile={
                                        profile
                                    }
                                    isPreview={
                                        isPreview
                                    }
                                    primaryColor={
                                        appearance.primaryTextColor
                                    }
                                    secondaryColor={
                                        appearance.secondaryTextColor
                                    }
                                />
                            )}
                        </div>
                    )}

                    {/* BENTO / MASONRY */}
                    <div
                        style={{
                            marginTop: `${sectionSpacing}px`,
                        }}
                    >
                        <BentoGrid
                            gap={
                                cardGap
                            }
                        >
                            {profile.links
                                .filter(
                                    (link) =>
                                        link.visible,
                                )
                                .map(
                                    (link) => (
                                        <BentoGridItem
                                            key={
                                                link.id
                                            }
                                            link={
                                                link
                                            }
                                            gap={
                                                cardGap
                                            }
                                        >
                                            <VisualLinkCard
                                                profile={
                                                    profile
                                                }
                                                link={
                                                    link
                                                }
                                                visitor={
                                                    visitor
                                                }
                                                isPreview={
                                                    isPreview
                                                }
                                                onClick={() =>
                                                    onLinkClick?.(
                                                        link.id,
                                                    )
                                                }
                                            />
                                        </BentoGridItem>
                                    ),
                                )}
                        </BentoGrid>
                    </div>

                    <div
                        style={{
                            marginTop: `${Math.max(
                                sectionSpacing,
                                30,
                            )}px`,
                        }}
                    >
                        <LinkzzzFooter
                            profile={profile}
                            isPreview={
                                isPreview
                            }
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| HERO
|--------------------------------------------------------------------------
*/

function VisualHero({
    profile,
    isPreview,
    horizontalPadding,
    children,
}: {
    profile: PublicProfileData;

    isPreview: boolean;

    horizontalPadding: number;

    children?: ReactNode;
}) {
    const appearance =
        profile.appearance;

    const hero =
        appearance.hero;

    const rawHeight =
        hero?.height ??
        360;

    const height =
        isPreview
            ? Math.max(
                rawHeight *
                0.8,
                190,
            )
            : rawHeight;

    const fullBleed =
        hero?.fullBleed ??
        true;

    return (
        <div
            className="relative"
            style={{
                height: `${height}px`,

                marginLeft:
                    fullBleed
                        ? "0px"
                        : `${horizontalPadding}px`,

                marginRight:
                    fullBleed
                        ? "0px"
                        : `${horizontalPadding}px`,
            }}
        >
            <div
                className="absolute inset-0 overflow-hidden"
                style={{
                    borderRadius:
                        fullBleed
                            ? "0px"
                            : "24px",
                }}
            >
                {profile.coverImageUrl ? (
                    <img
                        src={
                            profile.coverImageUrl
                        }
                        alt=""
                        className="absolute inset-0 h-full w-full"
                        style={{
                            objectFit:
                                hero?.imageFit ??
                                "cover",

                            objectPosition:
                                getObjectPosition(
                                    hero?.imagePosition ??
                                    "center",
                                ),
                        }}
                    />) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                appearance.backgroundType ===
                                    "gradient"
                                    ? `linear-gradient(
                      145deg,
                      ${appearance.gradientFrom},
                      ${appearance.gradientTo}
                    )`
                                    : `linear-gradient(
                      145deg,
                      ${appearance.backgroundColor},
                      ${appearance.gradientTo}
                    )`,
                        }}
                    />
                )}

                {hero?.overlayEnabled !==
                    false && (
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundColor:
                                    hero?.overlayColor ??
                                    "#000000",

                                opacity:
                                    hero?.overlayOpacity ??
                                    0.32,
                            }}
                        />
                    )}

                <div
                    className="absolute inset-x-0 bottom-0 h-3/4"
                    style={{
                        background:
                            "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.64) 100%)",
                    }}
                />
            </div>

            {children}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| VISUAL IDENTITY
|--------------------------------------------------------------------------
*/

function VisualIdentity({
    profile,
    isPreview,
    heroEnabled,
    alignmentOverride,
    primaryColor,
    secondaryColor,
    showAvatar = true,
    showName = true,
    showUsername = true,
    showBio = true,
    showLocation = true,
}: {
    profile: PublicProfileData;

    isPreview: boolean;

    heroEnabled: boolean;

    alignmentOverride?:
    | "left"
    | "center";

    primaryColor: string;

    secondaryColor: string;

    showAvatar?: boolean;

    showName?: boolean;

    showUsername?: boolean;

    showBio?: boolean;

    showLocation?: boolean;
}) {
    const identity =
        profile.appearance.identity;

    const alignment =
        alignmentOverride ??
        identity?.alignment ??
        "center";

    const avatarSize =
        identity?.avatarSize ??
        88;

    const nameSize =
        identity?.nameSize ??
        28;

    const alignClass =
        alignment === "left"
            ? "items-start text-left"
            : "items-center text-center";

    return (
        <header
            className={`flex flex-col ${alignClass}`}
        >
            {showAvatar && (
                <ProfileAvatar
                    profile={profile}
                    size={
                        isPreview
                            ? Math.max(
                                avatarSize *
                                0.78,
                                54,
                            )
                            : avatarSize
                    }
                    radius={getAvatarRadius(
                        identity?.avatarShape ??
                        "circle",
                    )}
                    elevated={
                        heroEnabled
                    }
                />
            )}

            {showName && (
                <h1
                    className={`font-black tracking-[-0.03em] ${showAvatar
                        ? "mt-4"
                        : ""
                        }`}
                    style={{
                        fontSize: `${isPreview
                            ? Math.max(
                                nameSize *
                                0.76,
                                18,
                            )
                            : nameSize
                            }px`,

                        color:
                            primaryColor,
                    }}
                >
                    {
                        profile.displayName
                    }
                </h1>
            )}

            {showUsername &&
                profile.username && (
                    <p
                        className="mt-1 text-sm font-medium"
                        style={{
                            color:
                                secondaryColor,
                        }}
                    >
                        @
                        {
                            profile.username
                        }
                    </p>
                )}

            {showBio &&
                profile.bio && (
                    <p
                        className={`mt-3 leading-6 ${isPreview
                            ? "text-xs"
                            : "text-sm sm:text-[15px]"
                            }`}
                        style={{
                            maxWidth: `${identity?.bioMaxWidth ??
                                520
                                }px`,

                            color:
                                secondaryColor,
                        }}
                    >
                        {profile.bio}
                    </p>
                )}

            {showLocation &&
                profile.locationLabel && (
                    <div
                        className="mt-3 flex items-center gap-1.5 text-xs"
                        style={{
                            color:
                                secondaryColor,
                        }}
                    >
                        <MapPin
                            size={13}
                        />

                        {
                            profile.locationLabel
                        }
                    </div>
                )}
        </header>
    );
}

/*
|--------------------------------------------------------------------------
| SOCIAL LINKS
|--------------------------------------------------------------------------
*/

function SocialLinks({
    profile,
    isPreview,
    mode,
    alignmentOverride,
    colorOverride,
    onSocialClick,
}: {
    profile: PublicProfileData;

    isPreview: boolean;

    mode:
    | "classic"
    | "visual";

    alignmentOverride?:
    | "left"
    | "center";

    colorOverride?: string;

    onSocialClick?: (
        socialId: string,
    ) => void;
}) {
    const appearance =
        profile.appearance;

    const identity =
        appearance.identity;

    const visibleSocials =
        profile.socials.filter(
            (social) =>
                social.visible,
        );

    if (
        visibleSocials.length ===
        0
    ) {
        return null;
    }

    const iconStyle =
        identity?.socialIconStyle ??
        "circle";

    const iconSize =
        identity?.socialIconSize ??
        22;

    const color =
        colorOverride ??
        appearance.primaryTextColor;

    const alignment =
        alignmentOverride ??
        identity?.alignment ??
        "center";

    return (
        <div
            className={`flex flex-wrap items-center ${mode === "visual" &&
                alignment === "left"
                ? "justify-start"
                : "justify-center"
                } ${mode === "classic"
                    ? isPreview
                        ? "mt-5 gap-2"
                        : "mt-7 gap-2.5"
                    : isPreview
                        ? "mt-4 gap-2"
                        : "mt-5 gap-3"
                }`}
        >
            {visibleSocials.map(
                (social) => {
                    const Icon =
                        social.icon;

                    return (
                        <a
                            key={
                                social.id
                            }
                            href={
                                isPreview
                                    ? undefined
                                    : social.url
                            }
                            target={
                                isPreview
                                    ? undefined
                                    : "_blank"
                            }
                            rel={
                                isPreview
                                    ? undefined
                                    : "noopener noreferrer"
                            }
                            onClick={(
                                event,
                            ) => {
                                if (
                                    isPreview
                                ) {
                                    event.preventDefault();

                                    return;
                                }

                                onSocialClick?.(
                                    social.id,
                                );
                            }}
                            aria-label={
                                social.name
                            }
                            className={`flex items-center justify-center border backdrop-blur-md transition duration-200 ${isPreview
                                ? "h-9 w-9"
                                : "h-11 w-11 hover:-translate-y-0.5"
                                }`}
                            style={{
                                borderRadius:
                                    getSocialRadius(
                                        iconStyle,
                                    ),

                                borderColor:
                                    iconStyle ===
                                        "plain"
                                        ? "transparent"
                                        : addAlpha(
                                            color,
                                            0.22,
                                        ),

                                backgroundColor:
                                    iconStyle ===
                                        "plain"
                                        ? "transparent"
                                        : addAlpha(
                                            color,
                                            0.08,
                                        ),

                                color,
                            }}
                        >
                            <Icon
                                size={
                                    isPreview
                                        ? Math.min(
                                            iconSize,
                                            18,
                                        )
                                        : iconSize
                                }
                            />
                        </a>
                    );
                },
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| STATS
|--------------------------------------------------------------------------
*/

function ProfileStats({
    profile,
    isPreview,
    primaryColor,
    secondaryColor,
    alignment = "center",
}: {
    profile: PublicProfileData;

    isPreview: boolean;

    primaryColor?: string;

    secondaryColor?: string;

    alignment?:
    | "left"
    | "center";
}) {
    const stats =
        profile.stats?.filter(
            (stat) =>
                stat.visible,
        ) ?? [];

    if (
        stats.length === 0
    ) {
        return null;
    }

    return (
        <div
            className={`mt-5 flex flex-wrap ${alignment === "left"
                ? "justify-start"
                : "justify-center"
                } ${isPreview
                    ? "gap-5"
                    : "gap-8"
                }`}
        >
            {stats.map(
                (stat) => (
                    <div
                        key={
                            stat.id
                        }
                        className={
                            alignment ===
                                "left"
                                ? "text-left"
                                : "text-center"
                        }
                    >
                        <p
                            className={`font-black tracking-tight ${isPreview
                                ? "text-lg"
                                : "text-2xl"
                                }`}
                            style={{
                                color:
                                    primaryColor ??
                                    profile.appearance
                                        .primaryTextColor,
                            }}
                        >
                            {
                                stat.value
                            }
                        </p>

                        <p
                            className="mt-0.5 text-xs"
                            style={{
                                color:
                                    secondaryColor ??
                                    profile.appearance
                                        .secondaryTextColor,
                            }}
                        >
                            {
                                stat.label
                            }
                        </p>
                    </div>
                ),
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| BENTO / MASONRY
|--------------------------------------------------------------------------
*/

const BENTO_ROW_HEIGHT =
    8;

function BentoGrid({
    gap,
    children,
}: {
    gap: number;

    children: ReactNode;
}) {
    return (
        <div
            style={{
                display: "grid",

                gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",

                gridAutoRows: `${BENTO_ROW_HEIGHT}px`,

                gridAutoFlow:
                    "dense",

                gap: `${gap}px`,

                alignItems:
                    "start",
            }}
        >
            {children}
        </div>
    );
}

function BentoGridItem({
    link,
    gap,
    children,
}: {
    link: PublicProfileLink;

    gap: number;

    children: ReactNode;
}) {
    const contentRef =
        useRef<HTMLDivElement>(
            null,
        );

    const [rowSpan, setRowSpan] =
        useState(20);

    const layout =
        link.layout ??
        "button";

    const columnSpan =
        getGridColumnSpan(
            layout,
        );

    useEffect(() => {
        const element =
            contentRef.current;

        if (!element) {
            return;
        }

        function calculateSpan() {
            if (!element) {
                return;
            }

            const height =
                element.getBoundingClientRect()
                    .height;

            if (
                height <= 0
            ) {
                return;
            }

            const nextSpan =
                Math.max(
                    1,
                    Math.ceil(
                        (height + gap) /
                        (BENTO_ROW_HEIGHT +
                            gap),
                    ),
                );

            setRowSpan(
                nextSpan,
            );
        }

        calculateSpan();

        const observer =
            new ResizeObserver(
                () => {
                    calculateSpan();
                },
            );

        observer.observe(
            element,
        );

        return () => {
            observer.disconnect();
        };
    }, [
        gap,
        link.layout,
        link.aspectRatio,
        link.customStyle?.height,
        link.customStyle
            ?.borderRadius,
        link.imageUrl,
    ]);

    return (
        <div
            className={
                columnSpan === 2
                    ? "col-span-2"
                    : "col-span-1"
            }
            style={{
                gridRowEnd: `span ${rowSpan}`,

                alignSelf:
                    "start",

                minWidth: 0,
            }}
        >
            <div
                ref={contentRef}
                className="w-full"
            >
                {children}
            </div>
        </div>
    );
}

function getGridColumnSpan(
    layout: LinkCardLayout,
) {
    if (
        layout === "button" ||
        layout === "full" ||
        layout === "featured"
    ) {
        return 2;
    }

    return 1;
}

/*
|--------------------------------------------------------------------------
| VISUAL LINK CARD
|--------------------------------------------------------------------------
*/

function VisualLinkCard({
    profile,
    link,
    visitor,
    isPreview,
    onClick,
}: {
    profile: PublicProfileData;

    link: PublicProfileLink;

    visitor?: VisitorLocation;

    isPreview: boolean;

    onClick: () => void;
}) {
    const appearance =
        profile.appearance;

    const cards =
        appearance.cards;

    const layout: LinkCardLayout =
        link.layout ??
        cards?.defaultLayout ??
        "button";

    /*
     * Visual profile can still
     * contain classic buttons.
     */
    if (
        layout === "button"
    ) {
        return (
            <div className="w-full">
                <ClassicLinkButton
                    profile={profile}
                    link={link}
                    visitor={visitor}
                    isPreview={
                        isPreview
                    }
                    onClick={
                        onClick
                    }
                />
            </div>
        );
    }

    const custom =
        link.customStyle
            ?.enabled
            ? link.customStyle
            : undefined;

    const backgroundType:
        LinkCardBackgroundType =
        custom?.backgroundType ??
        (link.imageUrl
            ? "image"
            : "gradient");

    const rawHeight =
        custom?.height ??
        getGlobalCardHeight(
            layout,
            cards?.cardHeight ??
            220,
            cards?.featuredHeight ??
            340,
        );

    const height =
        isPreview
            ? Math.max(
                rawHeight *
                0.78,
                layout === "compact"
                    ? 90
                    : 115,
            )
            : rawHeight;

    const aspectRatio:
        LinkCardAspectRatio =
        link.aspectRatio ??
        "auto";

    const ratioValue =
        getAspectRatioValue(
            aspectRatio,
        );

    const radius =
        custom?.borderRadius ??
        cards?.borderRadius ??
        18;

    const borderWidth =
        custom?.borderWidth ??
        cards?.borderWidth ??
        1;

    const borderColor =
        custom?.borderColor ??
        addAlpha(
            appearance.primaryTextColor,
            0.14,
        );

    const textColor =
        custom?.textColor ??
        appearance.primaryTextColor;

    const shadow =
        custom?.shadow ??
        cards?.shadow ??
        2;

    const overlayColor =
        custom?.overlayColor ??
        cards?.overlayColor ??
        "#000000";

    const overlayOpacity =
        custom?.overlayOpacity ??
        link.overlayOpacity ??
        cards?.overlayOpacity ??
        0.4;

    const titlePosition =
        link.titlePosition ??
        cards?.titlePosition ??
        "bottom-left";

    const badgeStyle:
        LinkPlatformBadgeStyle =
        custom?.platformBadgeStyle ??
        "circle";

    const badgePosition:
        LinkPlatformBadgePosition =
        custom?.platformBadgePosition ??
        "top-left";

    const badgeBackground =
        custom?.platformBadgeBackgroundColor ??
        "#ffffff";

    const badgeColor =
        custom?.platformBadgeTextColor ??
        "#09090b";

    const Icon =
        link.icon;

    const resolvedUrl =
        resolveLinkUrl(
            link,
            visitor,
        );

    return (
        <a
            href={
                isPreview
                    ? undefined
                    : resolvedUrl
            }
            target={
                isPreview
                    ? undefined
                    : "_blank"
            }
            rel={
                isPreview
                    ? undefined
                    : "noopener noreferrer"
            }
            onClick={(
                event,
            ) => {
                if (
                    isPreview
                ) {
                    event.preventDefault();

                    return;
                }

                onClick();
            }}
            className={`group relative block w-full overflow-hidden ${getHoverClass(
                cards?.hoverEffect ??
                "lift",
            )}`}
            style={{
                height:
                    aspectRatio ===
                        "auto"
                        ? `${height}px`
                        : undefined,

                aspectRatio:
                    ratioValue,

                borderRadius: `${radius}px`,

                borderStyle:
                    borderWidth > 0
                        ? "solid"
                        : "none",

                borderWidth: `${borderWidth}px`,

                borderColor,

                color:
                    textColor,

                background:
                    getVisualCardBackground(
                        backgroundType,
                        custom,
                        appearance,
                    ),

                boxShadow:
                    getCardShadow(
                        shadow,
                    ),

                transition:
                    "transform 180ms ease, filter 180ms ease, box-shadow 180ms ease",
            }}
        >
            {/* IMAGE */}
            {backgroundType ===
                "image" &&
                link.imageUrl && (
                    <img
                        src={
                            link.imageUrl
                        }
                        alt={
                            link.imageAlt ??
                            link.title
                        }
                        className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.025]"
                        style={{
                            objectFit:
                                link.imageFit ??
                                cards?.imageFit ??
                                "cover",

                            objectPosition:
                                getObjectPosition(
                                    link.imagePosition ??
                                    "center",
                                ),
                        }}
                    />
                )}

            {/* IMAGE FALLBACK */}
            {backgroundType ===
                "image" &&
                !link.imageUrl && (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(
                145deg,
                ${appearance.buttonBackgroundColor},
                ${appearance.gradientTo}
              )`,
                        }}
                    />
                )}

            {/* OVERLAY */}
            {link.overlayEnabled !==
                false && (
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundColor:
                                overlayColor,

                            opacity:
                                overlayOpacity,
                        }}
                    />
                )}

            {/* READABILITY GRADIENT */}
            {backgroundType ===
                "image" &&
                (titlePosition ===
                    "bottom-left" ||
                    titlePosition ===
                    "bottom-center") && (
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.65) 100%)",
                        }}
                    />
                )}

            {/* PLATFORM BADGE */}
            {(link.showPlatformIcon ??
                true) &&
                Icon &&
                badgeStyle !==
                "none" && (
                    <div
                        className={`absolute z-20 flex items-center justify-center ${badgePosition ===
                            "top-right"
                            ? isPreview
                                ? "right-3 top-3"
                                : "right-4 top-4"
                            : isPreview
                                ? "left-3 top-3"
                                : "left-4 top-4"
                            } ${badgeStyle ===
                                "circle"
                                ? isPreview
                                    ? "h-8 w-8 rounded-full"
                                    : "h-10 w-10 rounded-full"
                                : ""
                            }`}
                        style={{
                            backgroundColor:
                                badgeStyle ===
                                    "circle"
                                    ? badgeBackground
                                    : "transparent",

                            color:
                                badgeColor,

                            boxShadow:
                                badgeStyle ===
                                    "circle"
                                    ? "0 6px 20px rgba(0,0,0,0.18)"
                                    : "none",
                        }}
                    >
                        <Icon
                            size={
                                isPreview
                                    ? 15
                                    : 19
                            }
                        />
                    </div>
                )}

            {/* CARD CONTENT */}
            <div
                className={`absolute inset-0 z-10 flex ${isPreview
                    ? "p-3"
                    : "p-4 sm:p-5"
                    } ${getTitlePositionClass(
                        titlePosition,
                    )}`}
            >
                <div
                    className={
                        titlePosition ===
                            "bottom-center" ||
                            titlePosition ===
                            "center"
                            ? "w-full text-center"
                            : "min-w-0"
                    }
                >
                    {(link.showTitle ??
                        true) && (
                            <p
                                className="font-black leading-tight tracking-[-0.025em]"
                                style={{
                                    color:
                                        textColor,

                                    fontSize: `${isPreview
                                        ? Math.max(
                                            (cards?.titleSize ??
                                                20) *
                                            0.72,
                                            12,
                                        )
                                        : cards?.titleSize ??
                                        20
                                        }px`,
                                }}
                            >
                                {link.title}
                            </p>
                        )}

                    {(link.showDescription ??
                        false) &&
                        link.description && (
                            <p
                                className={`mt-1 line-clamp-2 ${isPreview
                                    ? "text-[10px]"
                                    : "text-xs sm:text-sm"
                                    }`}
                                style={{
                                    color:
                                        textColor,

                                    opacity:
                                        0.78,
                                }}
                            >
                                {
                                    link.description
                                }
                            </p>
                        )}
                </div>
            </div>

            {/* EXTERNAL LINK */}
            {!isPreview && (
                <div
                    className={`absolute z-20 opacity-0 transition-opacity group-hover:opacity-100 ${badgePosition ===
                        "top-right"
                        ? "left-4 top-4"
                        : "right-4 top-4"
                        }`}
                    style={{
                        color:
                            textColor,
                    }}
                >
                    <ExternalLink
                        size={16}
                    />
                </div>
            )}
        </a>
    );
}

/*
|--------------------------------------------------------------------------
| CLASSIC LINK BUTTON
|--------------------------------------------------------------------------
*/

function ClassicLinkButton({
    profile,
    link,
    visitor,
    isPreview,
    onClick,
}: {
    profile: PublicProfileData;

    link: PublicProfileLink;

    visitor?: VisitorLocation;

    isPreview: boolean;

    onClick: () => void;
}) {
    const appearance =
        profile.appearance;

    const Icon =
        link.icon;

    const resolvedUrl =
        resolveLinkUrl(
            link,
            visitor,
        );

    return (
        <a
            href={
                isPreview
                    ? undefined
                    : resolvedUrl
            }
            target={
                isPreview
                    ? undefined
                    : "_blank"
            }
            rel={
                isPreview
                    ? undefined
                    : "noopener noreferrer"
            }
            onClick={(
                event,
            ) => {
                if (
                    isPreview
                ) {
                    event.preventDefault();

                    return;
                }

                onClick();
            }}
            className={`group flex w-full items-center gap-4 border text-left backdrop-blur-xl transition duration-200 ${isPreview
                ? "min-h-16 px-3.5 py-3"
                : "min-h-[72px] px-4 py-3.5 hover:-translate-y-0.5 active:scale-[0.99] sm:px-5"
                }`}
            style={getButtonStyle(
                appearance,
            )}
        >
            {(link.showPlatformIcon ??
                true) &&
                Icon && (
                    <div
                        className={`flex shrink-0 items-center justify-center rounded-xl ${isPreview
                            ? "h-9 w-9"
                            : "h-11 w-11"
                            }`}
                        style={{
                            backgroundColor:
                                addAlpha(
                                    appearance.buttonTextColor,
                                    0.09,
                                ),

                            color:
                                appearance.buttonTextColor,
                        }}
                    >
                        <Icon
                            size={
                                isPreview
                                    ? 16
                                    : 19
                            }
                        />
                    </div>
                )}

            <div className="min-w-0 flex-1">
                {(link.showTitle ??
                    true) && (
                        <p
                            className={`truncate font-semibold ${isPreview
                                ? "text-xs"
                                : "text-sm sm:text-[15px]"
                                }`}
                        >
                            {link.title}
                        </p>
                    )}

                {(link.showDescription ??
                    true) &&
                    link.description && (
                        <p className="mt-0.5 truncate text-xs opacity-60">
                            {
                                link.description
                            }
                        </p>
                    )}
            </div>

            {!isPreview && (
                <ExternalLink
                    size={16}
                    className="shrink-0 opacity-40 transition group-hover:opacity-100"
                />
            )}
        </a>
    );
}

/*
|--------------------------------------------------------------------------
| TOP BAR
|--------------------------------------------------------------------------
*/

function ProfileTopBar({
    profile,
    visitor,
    isPreview,
    onShare,
    visual = false,
}: {
    profile: PublicProfileData;

    visitor?: VisitorLocation;

    isPreview: boolean;

    onShare?: () => void;

    visual?: boolean;
}) {
    const appearance =
        profile.appearance;

    const foreground =
        visual
            ? "#ffffff"
            : appearance.primaryTextColor;

    return (
        <div className="flex min-h-10 items-center justify-between gap-3">
            {visitor ? (
                <div
                    className="inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[11px] backdrop-blur-xl"
                    style={{
                        color:
                            foreground,

                        borderColor:
                            visual
                                ? "rgba(255,255,255,0.18)"
                                : addAlpha(
                                    appearance.primaryTextColor,
                                    0.12,
                                ),

                        backgroundColor:
                            visual
                                ? "rgba(0,0,0,0.25)"
                                : addAlpha(
                                    appearance.primaryTextColor,
                                    0.05,
                                ),
                    }}
                >
                    <span>
                        {
                            visitor.flag
                        }
                    </span>

                    <span className="font-semibold">
                        {
                            visitor.countryName
                        }
                    </span>
                </div>
            ) : (
                <div />
            )}

            {!isPreview && (
                <button
                    type="button"
                    onClick={onShare}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-xl transition hover:scale-105"
                    style={{
                        color:
                            foreground,

                        borderColor:
                            visual
                                ? "rgba(255,255,255,0.18)"
                                : addAlpha(
                                    appearance.primaryTextColor,
                                    0.12,
                                ),

                        backgroundColor:
                            visual
                                ? "rgba(0,0,0,0.25)"
                                : addAlpha(
                                    appearance.primaryTextColor,
                                    0.05,
                                ),
                    }}
                    aria-label="Share profile"
                >
                    <Share2
                        size={17}
                    />
                </button>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| AVATARS
|--------------------------------------------------------------------------
*/

function ClassicAvatar({
    profile,
    isPreview,
}: {
    profile: PublicProfileData;

    isPreview: boolean;
}) {
    return (
        <div className="flex justify-center">
            <ProfileAvatar
                profile={profile}
                size={
                    isPreview
                        ? 80
                        : 108
                }
                radius="50%"
                elevated
            />
        </div>
    );
}

function ProfileAvatar({
    profile,
    size,
    radius,
    elevated = false,
}: {
    profile: PublicProfileData;

    size: number;

    radius: string;

    elevated?: boolean;
}) {
    const style: CSSProperties = {
        width: `${size}px`,

        height: `${size}px`,

        borderRadius:
            radius,
    };

    if (
        profile.avatarUrl
    ) {
        return (
            <div
                className={`shrink-0 overflow-hidden border ${elevated
                    ? "border-white/20 shadow-2xl"
                    : "border-white/10"
                    }`}
                style={style}
            >
                <img
                    src={
                        profile.avatarUrl
                    }
                    alt={
                        profile.displayName
                    }
                    className="h-full w-full object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={`flex shrink-0 items-center justify-center border bg-zinc-950 font-black text-white ${elevated
                ? "border-white/20 shadow-2xl"
                : "border-white/10"
                }`}
            style={style}
        >
            <span
                style={{
                    fontSize: `${Math.max(
                        size *
                        0.22,
                        14,
                    )}px`,
                }}
            >
                {getInitials(
                    profile.displayName,
                )}
            </span>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| FOOTER
|--------------------------------------------------------------------------
*/

function LinkzzzFooter({
    profile,
    isPreview,
}: {
    profile: PublicProfileData;

    isPreview: boolean;
}) {
    return (
        <footer
            className={`text-center ${isPreview
                ? "pb-1"
                : "pb-3"
                }`}
        >
            <span
                className="inline-flex text-[10px] font-black tracking-[0.18em] opacity-40"
                style={{
                    color:
                        profile.appearance
                            .primaryTextColor,
                }}
            >
                LINKZZZ
            </span>
        </footer>
    );
}

/*
|--------------------------------------------------------------------------
| GEO ROUTING
|--------------------------------------------------------------------------
*/

function resolveLinkUrl(
    link: PublicProfileLink,
    visitor?: VisitorLocation,
) {
    if (!visitor) {
        return link.url;
    }

    const destination =
        link.geoDestinations?.find(
            (route) =>
                route.countryCode.toUpperCase() ===
                visitor.countryCode.toUpperCase(),
        );

    return (
        destination?.url ||
        link.url
    );
}

/*
|--------------------------------------------------------------------------
| PAGE BACKGROUND
|--------------------------------------------------------------------------
*/

function getPageBackground(
    profile: PublicProfileData,
) {
    const appearance =
        profile.appearance;

    if (
        appearance.backgroundType ===
        "gradient"
    ) {
        return `linear-gradient(
      135deg,
      ${appearance.gradientFrom},
      ${appearance.gradientTo}
    )`;
    }

    return appearance.backgroundColor;
}

/*
|--------------------------------------------------------------------------
| VISUAL CARD BACKGROUND
|--------------------------------------------------------------------------
*/

function getVisualCardBackground(
    type: LinkCardBackgroundType,
    custom:
        | PublicProfileLink["customStyle"]
        | undefined,
    appearance: PublicProfileData["appearance"],
) {
    if (
        type === "solid"
    ) {
        return (
            custom?.backgroundColor ??
            appearance.buttonBackgroundColor
        );
    }

    if (
        type === "gradient"
    ) {
        return `linear-gradient(
      145deg,
      ${custom?.gradientFrom ??
            appearance.gradientFrom
            },
      ${custom?.gradientTo ??
            appearance.gradientTo
            }
    )`;
    }

    return `linear-gradient(
    145deg,
    ${appearance.buttonBackgroundColor},
    ${appearance.gradientTo}
  )`;
}

/*
|--------------------------------------------------------------------------
| CLASSIC BUTTON STYLE
|--------------------------------------------------------------------------
*/

function getButtonStyle(
    appearance: PublicProfileData["appearance"],
): CSSProperties {
    const base: CSSProperties = {
        borderRadius: `${appearance.borderRadius}px`,

        color:
            appearance.buttonTextColor,

        boxShadow:
            getClassicShadow(
                appearance.shadow,
            ),
    };

    if (
        appearance.buttonStyle ===
        "outline"
    ) {
        return {
            ...base,

            backgroundColor:
                "transparent",

            borderColor:
                appearance.buttonBorderColor,
        };
    }

    if (
        appearance.buttonStyle ===
        "glass"
    ) {
        return {
            ...base,

            backgroundColor:
                addAlpha(
                    appearance.buttonBackgroundColor,
                    0.13,
                ),

            borderColor:
                addAlpha(
                    appearance.buttonBorderColor,
                    0.34,
                ),

            backdropFilter:
                "blur(14px)",
        };
    }

    return {
        ...base,

        backgroundColor:
            appearance.buttonBackgroundColor,

        borderColor:
            appearance.buttonBorderColor,
    };
}

/*
|--------------------------------------------------------------------------
| ASPECT RATIO
|--------------------------------------------------------------------------
*/

function getAspectRatioValue(
    ratio:
        LinkCardAspectRatio,
) {
    if (
        ratio === "square"
    ) {
        return "1 / 1";
    }

    if (
        ratio === "landscape"
    ) {
        return "4 / 3";
    }

    if (
        ratio === "portrait"
    ) {
        return "3 / 4";
    }

    if (
        ratio === "wide"
    ) {
        return "16 / 9";
    }

    return undefined;
}

/*
|--------------------------------------------------------------------------
| CARD SIZE
|--------------------------------------------------------------------------
*/

function getGlobalCardHeight(
    layout: LinkCardLayout,
    normalHeight: number,
    featuredHeight: number,
) {
    if (
        layout === "featured"
    ) {
        return featuredHeight;
    }

    if (
        layout === "compact"
    ) {
        return Math.min(
            normalHeight,
            140,
        );
    }

    if (
        layout === "half"
    ) {
        return Math.min(
            normalHeight,
            210,
        );
    }

    return normalHeight;
}

/*
|--------------------------------------------------------------------------
| HOVER
|--------------------------------------------------------------------------
*/

function getHoverClass(
    effect:
        | "none"
        | "lift"
        | "scale"
        | "glow",
) {
    if (
        effect === "lift"
    ) {
        return "hover:-translate-y-1";
    }

    if (
        effect === "scale"
    ) {
        return "hover:scale-[1.015]";
    }

    if (
        effect === "glow"
    ) {
        return "hover:brightness-110";
    }

    return "";
}

/*
|--------------------------------------------------------------------------
| SHADOWS
|--------------------------------------------------------------------------
*/

function getClassicShadow(
    shadow: number,
) {
    if (
        shadow <= 0
    ) {
        return "none";
    }

    return `0 ${shadow * 4
        }px ${shadow * 14
        }px rgba(0,0,0,${0.08 +
        shadow *
        0.04
        })`;
}

function getCardShadow(
    shadow: number,
) {
    if (
        shadow <= 0
    ) {
        return "none";
    }

    return `0 ${shadow * 5
        }px ${shadow * 18
        }px rgba(0,0,0,${0.09 +
        shadow *
        0.04
        })`;
}

/*
|--------------------------------------------------------------------------
| POSITION
|--------------------------------------------------------------------------
*/

function getTitlePositionClass(
    position:
        LinkTitlePosition,
) {
    if (
        position === "center"
    ) {
        return "items-center justify-center";
    }

    if (
        position ===
        "bottom-center"
    ) {
        return "items-end justify-center";
    }

    return "items-end justify-start";
}

function getAvatarRadius(
    shape:
        | "circle"
        | "rounded"
        | "square",
) {
    if (
        shape === "square"
    ) {
        return "0px";
    }

    if (
        shape === "rounded"
    ) {
        return "22%";
    }

    return "50%";
}

function getSocialRadius(
    style:
        | "plain"
        | "circle"
        | "square",
) {
    if (
        style === "plain"
    ) {
        return "0px";
    }

    if (
        style === "square"
    ) {
        return "12px";
    }

    return "9999px";
}

/*
|--------------------------------------------------------------------------
| INITIALS
|--------------------------------------------------------------------------
*/

function getInitials(
    name: string,
) {
    return (
        name
            .split(" ")
            .filter(Boolean)
            .map(
                (part) =>
                    part[0],
            )
            .join("")
            .slice(0, 2)
            .toUpperCase() ||
        "LZ"
    );
}

/*
|--------------------------------------------------------------------------
| HEX -> RGBA
|--------------------------------------------------------------------------
*/

function addAlpha(
    color: string,
    alpha: number,
) {
    const match =
        /^#([0-9a-f]{6})$/i.exec(
            color.trim(),
        );

    if (!match) {
        return color;
    }

    const value =
        match[1];

    const red =
        parseInt(
            value.slice(
                0,
                2,
            ),
            16,
        );

    const green =
        parseInt(
            value.slice(
                2,
                4,
            ),
            16,
        );

    const blue =
        parseInt(
            value.slice(
                4,
                6,
            ),
            16,
        );

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/*
|--------------------------------------------------------------------------
| UNAVAILABLE PROFILE
|--------------------------------------------------------------------------
*/

function UnavailableProfile({
    status,
}: {
    status:
    | "DRAFT"
    | "DISABLED";
}) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 text-white">
            <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-lg font-black">
                    LZ
                </div>

                <h1 className="mt-6 text-2xl font-bold">
                    Profile unavailable
                </h1>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {status ===
                        "DRAFT"
                        ? "This profile has not been published yet."
                        : "This profile is currently unavailable."}
                </p>

                <p className="mt-8 text-[10px] font-black tracking-[0.18em] text-zinc-700">
                    LINKZZZ
                </p>
            </div>
        </main>
    );
}

function getObjectPosition(
    position:
        | "center"
        | "top"
        | "bottom"
        | "left"
        | "right",
) {
    if (
        position === "top"
    ) {
        return "center top";
    }

    if (
        position === "bottom"
    ) {
        return "center bottom";
    }

    if (
        position === "left"
    ) {
        return "left center";
    }

    if (
        position === "right"
    ) {
        return "right center";
    }

    return "center center";
}