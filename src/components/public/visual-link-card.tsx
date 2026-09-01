"use client";

import { ExternalLink } from "lucide-react";

import { ClassicLinkButton } from "@/components/public/classic-profile-renderer";
import UserContentImage from "@/components/ui/user-content-image";
import {
    addAlpha,
    getAspectRatioValue,
    getCardShadow,
    getGlobalCardHeight,
    getHoverClass,
    getObjectPosition,
    getTitlePositionClass,
    getVisualCardBackground,
    resolveLinkUrl,
} from "@/components/public/profile-renderer-utils";
import type {
    LinkCardAspectRatio,
    LinkCardBackgroundType,
    LinkCardLayout,
    LinkPlatformBadgePosition,
    LinkPlatformBadgeStyle,
    PublicProfileData,
    PublicProfileLink,
    VisitorLocation,
} from "@/types/profile";

/*
|--------------------------------------------------------------------------
| VISUAL LINK CARD
|--------------------------------------------------------------------------
*/

export function VisualLinkCard({
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
                    <UserContentImage
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
