"use client";

import {
    useEffect,
    useState,
    type RefObject,
} from "react";

import {
    Share2,
} from "lucide-react";

import type {
    PublicProfileData,
} from "@/types/profile";

type VisualStickyHeaderProps = {
    profile: PublicProfileData;

    identityRef: RefObject<HTMLDivElement | null>;

    isPreview: boolean;

    onShare?: () => void;
};

export default function VisualStickyHeader({
    profile,
    identityRef,
    isPreview,
    onShare,
}: VisualStickyHeaderProps) {
    const [visible, setVisible] =
        useState(false);

    useEffect(() => {
        const element =
            identityRef.current;

        if (!element) {
            return;
        }

        const observer =
            new IntersectionObserver(
                ([entry]) => {
                    /*
                     * Header se pojavljuje samo kada je
                     * profile identity otišao IZNAD
                     * vidljivog prostora.
                     *
                     * Ako je samo ispod viewporta,
                     * ne prikazujemo ga.
                     */
                    const rootTop =
                        entry.rootBounds?.top ??
                        0;

                    const passedTop =
                        entry.boundingClientRect
                            .bottom <=
                        rootTop + 12;

                    setVisible(
                        !entry.isIntersecting &&
                        passedTop,
                    );
                },
                {
                    threshold: [
                        0,
                        0.15,
                        0.5,
                    ],
                },
            );

        observer.observe(
            element,
        );

        return () => {
            observer.disconnect();
        };
    }, [identityRef]);

    const appearance =
        profile.appearance;

    return (
        /*
         * h-0 znači da sticky header
         * ne zauzima dodatni prostor u layoutu.
         */
        <div className="sticky top-0 z-50 h-0">
            <div
                className={`border-b backdrop-blur-2xl transition-all duration-300 ${visible
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-full opacity-0"
                    }`}
                style={{
                    backgroundColor:
                        addAlpha(
                            appearance.backgroundColor,
                            0.9,
                        ),

                    borderColor:
                        addAlpha(
                            appearance.primaryTextColor,
                            0.12,
                        ),

                    color:
                        appearance.primaryTextColor,
                }}
            >
                <div className="flex min-h-[68px] items-center gap-3 px-4">
                    <StickyAvatar
                        profile={profile}
                        isPreview={
                            isPreview
                        }
                    />

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold sm:text-base">
                            {
                                profile.displayName
                            }
                        </p>

                        {profile.username && (
                            <p
                                className="mt-0.5 truncate text-[11px]"
                                style={{
                                    color:
                                        appearance.secondaryTextColor,
                                }}
                            >
                                @
                                {
                                    profile.username
                                }
                            </p>
                        )}
                    </div>

                    {!isPreview && (
                        <button
                            type="button"
                            onClick={
                                onShare
                            }
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition hover:scale-105"
                            style={{
                                borderColor:
                                    addAlpha(
                                        appearance.primaryTextColor,
                                        0.14,
                                    ),

                                backgroundColor:
                                    addAlpha(
                                        appearance.primaryTextColor,
                                        0.06,
                                    ),
                            }}
                            aria-label="Share profile"
                        >
                            <Share2
                                size={16}
                            />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function StickyAvatar({
    profile,
    isPreview,
}: {
    profile: PublicProfileData;

    isPreview: boolean;
}) {
    const size =
        isPreview
            ? 38
            : 42;

    const radius =
        getAvatarRadius(
            profile.appearance
                .identity
                ?.avatarShape ??
            "circle",
        );

    if (
        profile.avatarUrl
    ) {
        return (
            <div
                className="shrink-0 overflow-hidden border border-white/15"
                style={{
                    height: size,
                    width: size,
                    borderRadius:
                        radius,
                }}
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
            className="flex shrink-0 items-center justify-center border border-white/15 bg-zinc-950 text-xs font-black text-white"
            style={{
                height: size,
                width: size,
                borderRadius:
                    radius,
            }}
        >
            {getInitials(
                profile.displayName,
            )}
        </div>
    );
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
            color,
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