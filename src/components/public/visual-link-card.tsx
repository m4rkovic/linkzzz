"use client";

import type { CSSProperties } from "react";
import { ExternalLink } from "lucide-react";

import { ClassicLinkButton } from "@/components/public/classic-profile-renderer";
import UserContentImage from "@/components/ui/user-content-image";
import { PlatformIcon } from "@/config/platforms";
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
    focused = false,
    dimmed = false,
    disabled = false,
}: {
    profile: PublicProfileData;

    link: PublicProfileLink;

    visitor?: VisitorLocation;

    isPreview: boolean;

    onClick: () => void;

    focused?: boolean;

    dimmed?: boolean;

    disabled?: boolean;
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
                    focused={focused}
                    dimmed={dimmed}
                    disabled={disabled}
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
        (backgroundType === "image"
            ? 0
            : cards?.borderWidth ?? 1);

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

    const promoBadgeText = link.customStyle?.badgeText?.trim() ?? "";
    const promoBadgeBackground = link.customStyle?.badgeBackgroundColor ?? "#ffffff";
    const promoBadgeColor = link.customStyle?.badgeTextColor ?? "#09090b";
    const ctaText = link.customStyle?.ctaText?.trim() ?? "";
    const ctaStyle = link.customStyle?.ctaStyle ?? "none";
    const ctaBackground = link.customStyle?.ctaBackgroundColor ?? "#ffffff";
    const ctaColor = link.customStyle?.ctaTextColor ?? "#09090b";
    const contentPadding = custom?.contentPadding ?? 20;
    const titleSize = custom?.titleSize ?? (layout === "featured" ? Math.max(cards?.titleSize ?? 20, 24) : cards?.titleSize ?? 20);
    const descriptionSize = custom?.descriptionSize ?? 13;
    const descriptionColor = custom?.descriptionColor ?? textColor;
    const imageScale = Math.max(100, Math.min(125, custom?.imageScale ?? 100));

    const resolvedUrl =
        resolveLinkUrl(
            link,
            visitor,
        );

    const focusEffect = link.customStyle?.focusEffect ?? "none";
    const focusColor = link.customStyle?.focusColor ?? "#ffffff";
    const focusDelayMs = Math.max(0, link.customStyle?.focusDelayMs ?? 0);
    const focusClass = focused
        ? focusEffect === "glow-shake"
            ? "linkzzz-focus-glow linkzzz-focus-shake"
            : focusEffect === "glow"
                ? "linkzzz-focus-glow"
                : focusEffect === "shake"
                    ? "linkzzz-focus-shake"
                    : ""
        : "";

    return (
        <a
            href={
                isPreview || disabled
                    ? undefined
                    : resolvedUrl
            }
            target={
                isPreview || disabled
                    ? undefined
                    : "_blank"
            }
            rel={
                isPreview || disabled
                    ? undefined
                    : "noopener noreferrer"
            }
            onClick={(
                event,
            ) => {
                if (
                    isPreview || disabled
                ) {
                    event.preventDefault();

                    return;
                }

                if (!link.sensitiveContent?.enabled) {
                    onClick();
                }
            }}
            aria-disabled={disabled || undefined}
            className={`group relative block w-full overflow-hidden ${disabled ? "cursor-not-allowed opacity-60" : getHoverClass(
                cards?.hoverEffect ??
                "lift",
            )} ${focusClass} ${dimmed ? "linkzzz-focus-dim" : ""}`}
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
                    "transform 180ms ease, filter 180ms ease, box-shadow 180ms ease, opacity 220ms ease",
                "--linkzzz-focus-color": focusColor,
                "--linkzzz-focus-delay": `${focusDelayMs}ms`,
            } as CSSProperties}
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
                        className="absolute inset-0 h-full w-full transition-transform duration-500"
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

                            transform: `scale(${imageScale / 100})`,
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
                        <PlatformIcon
                            platform={link.platform ?? "custom"}
                            size={
                                isPreview
                                    ? 15
                                    : 19
                            }
                        />
                    </div>
                )}

            {disabled && (
                <div className={`absolute right-3 top-3 z-30 rounded-full bg-black/70 px-2.5 py-1 font-black uppercase tracking-[0.08em] text-white backdrop-blur ${isPreview ? "text-[8px]" : "text-[10px]"}`}>
                    Expired
                </div>
            )}

            {/* PROMOTIONAL BADGE */}
            {promoBadgeText && (
                <div
                    className={`absolute z-20 max-w-[65%] truncate font-bold uppercase tracking-[0.08em] ${isPreview ? "top-3 px-2 py-1 text-[8px]" : "top-4 px-2.5 py-1.5 text-[10px]"} ${badgePosition === "top-left" && (link.showPlatformIcon ?? true) ? (isPreview ? "right-3" : "right-4") : (isPreview ? "left-3" : "left-4")}`}
                    style={{
                        borderRadius: "999px",
                        backgroundColor: promoBadgeBackground,
                        color: promoBadgeColor,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
                    }}
                >
                    {promoBadgeText}
                </div>
            )}

            {/* CARD CONTENT */}
            <div
                className={`absolute inset-0 z-10 flex ${getTitlePositionClass(
                    titlePosition,
                )}`}
                style={{
                    padding: `${isPreview ? Math.max(10, Math.round(contentPadding * 0.72)) : contentPadding}px`,
                }}
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
                                        ? Math.max(titleSize * 0.72, 12)
                                        : titleSize
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
                                className="mt-1 line-clamp-2"
                                style={{
                                    color: descriptionColor,
                                    opacity: 0.88,
                                    fontSize: `${isPreview ? Math.max(descriptionSize * 0.74, 9) : descriptionSize}px`,
                                }}
                            >
                                {
                                    link.description
                                }
                            </p>
                        )}

                    {ctaStyle !== "none" && ctaText && (
                        <span
                            className={`mt-3 inline-flex items-center justify-center font-bold ${ctaStyle === "solid" ? "w-full" : ""} ${isPreview ? "min-h-7 px-3 text-[9px]" : "min-h-9 px-4 text-xs"}`}
                            style={{
                                borderRadius: ctaStyle === "pill" ? "999px" : "12px",
                                backgroundColor: ctaStyle === "glass" ? "rgba(255,255,255,0.16)" : ctaBackground,
                                color: ctaStyle === "glass" ? textColor : ctaColor,
                                border: ctaStyle === "glass" ? "1px solid rgba(255,255,255,0.24)" : "none",
                                backdropFilter: ctaStyle === "glass" ? "blur(12px)" : undefined,
                                boxShadow: ctaStyle === "solid" ? "0 8px 24px rgba(0,0,0,0.18)" : "none",
                            }}
                        >
                            {ctaText}
                        </span>
                    )}
                </div>
            </div>

            {/* EXTERNAL LINK */}
            {!isPreview && !disabled && (
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
