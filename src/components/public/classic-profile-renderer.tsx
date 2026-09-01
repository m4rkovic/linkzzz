"use client";

import { ExternalLink, MapPin } from "lucide-react";

import {
    LinkzzzFooter,
    ProfileAvatar,
    ProfileTopBar,
    SocialLinks,
} from "@/components/public/profile-renderer-shared";
import {
    addAlpha,
    getButtonStyle,
    getPageBackground,
    resolveLinkUrl,
} from "@/components/public/profile-renderer-utils";
import type {
    PublicProfileData,
    PublicProfileLink,
    VisitorLocation,
} from "@/types/profile";

/*
|--------------------------------------------------------------------------
| CLASSIC PROFILE
|--------------------------------------------------------------------------
*/

export function ClassicProfileRenderer({
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
| CLASSIC LINK BUTTON
|--------------------------------------------------------------------------
*/

export function ClassicLinkButton({
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
