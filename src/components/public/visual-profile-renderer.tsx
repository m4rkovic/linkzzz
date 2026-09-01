"use client";

import { useRef, type ReactNode } from "react";
import { MapPin } from "lucide-react";

import {
    BentoGrid,
    BentoGridItem,
} from "@/components/public/bento-grid";
import {
    LinkzzzFooter,
    ProfileAvatar,
    ProfileStats,
    ProfileTopBar,
    SocialLinks,
} from "@/components/public/profile-renderer-shared";
import {
    getAvatarRadius,
    getObjectPosition,
    getPageBackground,
} from "@/components/public/profile-renderer-utils";
import UserContentImage from "@/components/ui/user-content-image";
import { VisualLinkCard } from "@/components/public/visual-link-card";
import VisualStickyHeader from "@/components/public/visual-sticky-header";
import type { PublicProfileData, VisitorLocation } from "@/types/profile";

/*
|--------------------------------------------------------------------------
| VISUAL PROFILE
|--------------------------------------------------------------------------
*/

export function VisualProfileRenderer({
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
                    <UserContentImage
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
