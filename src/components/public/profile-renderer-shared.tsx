"use client";

import type { CSSProperties } from "react";
import { Share2 } from "lucide-react";

import {
    addAlpha,
    getInitials,
    getSocialRadius,
} from "@/components/public/profile-renderer-utils";
import UserContentImage from "@/components/ui/user-content-image";
import type { PublicProfileData, VisitorLocation } from "@/types/profile";

/*
|--------------------------------------------------------------------------
| SOCIAL LINKS
|--------------------------------------------------------------------------
*/

export function SocialLinks({
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

export function ProfileStats({
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
| TOP BAR
|--------------------------------------------------------------------------
*/

export function ProfileTopBar({
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

export function ProfileAvatar({
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
                <UserContentImage
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

export function LinkzzzFooter({
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
| UNAVAILABLE PROFILE
|--------------------------------------------------------------------------
*/

export function UnavailableProfile({
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
