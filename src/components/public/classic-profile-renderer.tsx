"use client";

import { isLinkDimmed, useFocusHighlight } from "@/features/links/use-focus-highlight";
import { hasCampaignSchedule, pinLinkFirst, resolvePinnedLinkId } from "@/features/engagement/profile-engagement";
import { hasLinkSchedule, isLinkRendered, resolveLinkAvailability } from "@/features/links/link-availability";
import { useScheduleClock } from "@/features/scheduling/use-schedule-clock";
import { hasScheduleWindow } from "@/features/scheduling/schedule";
import type { CSSProperties } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { PlatformIcon } from "@/config/platforms";

import {
    LinkzzzFooter,
    ProfileAvatar,
    ProfileTopBar,
    ProfileVisitorSignals,
    SocialLinks,
} from "@/components/public/profile-renderer-shared";
import {
    addAlpha,
    getButtonStyle,
    getPageBackground,
    getPageStyleVariables,
    resolveLinkForVisitor,
    resolveLinkUrl,
} from "@/components/public/profile-renderer-utils";
import PageContentBlocks from "@/components/public/page-content-blocks";
import PageBackgroundEffects from "@/components/public/page-background-effects";
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
    initialNowMs = 0,
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

    initialNowMs?: number;
}) {
    const appearance =
        profile.appearance;

    const scheduleClockEnabled =
        profile.links.some(hasLinkSchedule) ||
        profile.contentBlocks.some(
            (block) => block.visible && (block.type === "COUNTDOWN" || hasScheduleWindow(block)),
        ) ||
        hasCampaignSchedule(profile.engagement);
    const nowMs = useScheduleClock(scheduleClockEnabled, initialNowMs);
    const runtimeProfile: PublicProfileData = {
        ...profile,
        links: profile.links.flatMap((link) => {
            const routed = resolveLinkForVisitor(link, visitor);
            return routed ? [routed] : [];
        }),
    };
    const visibleLinks = pinLinkFirst(
        runtimeProfile.links
            .map((link) => ({ link, state: resolveLinkAvailability(link, nowMs) }))
            .filter(({ state }) => isLinkRendered(state)),
        resolvePinnedLinkId(runtimeProfile, nowMs),
    );
    const focusedLink = useFocusHighlight(runtimeProfile, isPreview, nowMs);
    const page = appearance.page;
    const maxWidth = page?.maxWidth ?? 760;
    const verticalPadding = page?.verticalPadding ?? 28;

    return (
        <div
            className={`linkzzz-public-page relative w-full overflow-hidden ${isPreview
                ? "min-h-full"
                : "min-h-screen"
                }`}
            style={{
                ...getPageStyleVariables(profile),
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
            <PageBackgroundEffects profile={profile} />

            <div
                className={`linkzzz-page-horizontal relative mx-auto flex w-full max-w-6xl flex-col ${isPreview
                    ? "min-h-full py-4"
                    : "min-h-screen py-5 sm:py-6 lg:py-10"
                    }`}
            >
                <ProfileTopBar
                    profile={profile}
                    visitor={visitor}
                    isPreview={isPreview}
                    onShare={onShare}
                />

                <div
                    className="mx-auto flex w-full flex-1 flex-col justify-center"
                    style={{
                        maxWidth: `${maxWidth}px`,
                        paddingTop: isPreview ? "24px" : `${verticalPadding}px`,
                        paddingBottom: isPreview ? "24px" : `${verticalPadding}px`,
                    }}
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

                        <ProfileVisitorSignals profile={profile} />
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
                        className="linkzzz-section-gap-top"
                        style={{
                            display: "grid",

                            gap: `${appearance.buttonSpacing}px`,
                        }}
                    >
                        {visibleLinks.map(
                                ({ link, state }) => (
                                    <ClassicLinkButton
                                        key={
                                            link.id
                                        }
                                        profile={
                                            profile
                                        }
                                        link={focusedLink?.id === link.id ? focusedLink : link}
                                        visitor={
                                            visitor
                                        }
                                        isPreview={
                                            isPreview
                                        }
                                        onClick={() => {
                                            onLinkClick?.(link.id);
                                        }}
                                        focused={focusedLink?.id === link.id}
                                        dimmed={isLinkDimmed(focusedLink, link)}
                                        disabled={state === "EXPIRED_DISABLED"}
                                    />
                                ),
                            )}
                    </div>
                </div>

                {profile.contentBlocks.length > 0 && (
                    <div className="linkzzz-section-gap-top mx-auto w-full" style={{ maxWidth: `${maxWidth}px` }}>
                        <PageContentBlocks profile={profile} isPreview={isPreview} nowMs={nowMs} />
                    </div>
                )}

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

    const resolvedUrl =
        resolveLinkUrl(
            link,
            visitor,
        );

    const focusEffect = link.customStyle?.focusEffect ?? "none";
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
            className={`group flex w-full items-center gap-4 border text-left backdrop-blur-xl transition duration-200 ${focusClass} ${dimmed ? "linkzzz-focus-dim" : ""} ${disabled ? "cursor-not-allowed opacity-60" : ""} ${isPreview
                ? "min-h-16 px-3.5 py-3"
                : disabled
                    ? "min-h-[72px] px-4 py-3.5 sm:px-5"
                    : "min-h-[72px] px-4 py-3.5 hover:-translate-y-0.5 active:scale-[0.99] sm:px-5"
                }`}
            style={{
                ...getButtonStyle(appearance),
                "--linkzzz-focus-color": link.customStyle?.focusColor ?? appearance.buttonTextColor,
                "--linkzzz-focus-delay": `${Math.max(0, link.customStyle?.focusDelayMs ?? 0)}ms`,
            } as CSSProperties}
        >
            {(link.showPlatformIcon ??
                true) &&
                (
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
                        <PlatformIcon
                            platform={link.platform ?? "custom"}
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
                disabled ? (
                    <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.08em] opacity-60">Expired</span>
                ) : (
                    <ExternalLink
                        size={16}
                        className="shrink-0 opacity-40 transition group-hover:opacity-100"
                    />
                )
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
