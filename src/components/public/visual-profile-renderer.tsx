"use client";

import { useRef } from "react";

import {
    BentoGrid,
    BentoGridItem,
} from "@/components/public/bento-grid";
import {
    LinkzzzFooter,
    ProfileTopBar,
} from "@/components/public/profile-renderer-shared";
import {
    getPageBackground,
    getPageStyleVariables,
    resolveLinkForVisitor,
} from "@/components/public/profile-renderer-utils";
import { VisualProfileHero } from "@/components/public/visual-profile-hero";
import { VisualProfileIdentityGroup } from "@/components/public/visual-profile-identity-group";
import { resolveVisualProfileLayout } from "@/components/public/visual-profile-layout";
import { VisualLinkCard } from "@/components/public/visual-link-card";
import PageBackgroundEffects from "@/components/public/page-background-effects";
import VisualStickyHeader from "@/components/public/visual-sticky-header";
import { isLinkDimmed, useFocusHighlight } from "@/features/links/use-focus-highlight";
import { hasCampaignSchedule, pinLinkFirst, resolvePinnedLinkId } from "@/features/engagement/profile-engagement";
import { hasLinkSchedule, isLinkRendered, resolveLinkAvailability } from "@/features/links/link-availability";
import { useScheduleClock } from "@/features/scheduling/use-schedule-clock";
import { hasScheduleWindow } from "@/features/scheduling/schedule";
import type { PublicProfileData, VisitorLocation } from "@/types/profile";
import PageContentBlocks from "@/components/public/page-content-blocks";

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
    const identityRef =
        useRef<HTMLDivElement>(
            null,
        );

    const appearance = profile.appearance;
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
    const {
        maxWidth,
        heroEnabled,
        identityInsideHero,
        identityAlignment,
        showAvatar,
        showName,
        showUsername,
        showBio,
        showLocation,
        showSocials,
        showStats,
        heroPrimary,
        heroSecondary,
        cardGap,
        mobileColumns,
        verticalPadding,
        heroAvatarOverlap,
    } = resolveVisualProfileLayout(profile);

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
                    <VisualProfileHero
                        profile={profile}
                        isPreview={isPreview}
                    >
                        {identityInsideHero && (
                            <div
                                ref={identityRef}
                                className={`linkzzz-page-horizontal absolute inset-x-0 z-20 ${isPreview
                                    ? "bottom-4"
                                    : "bottom-6"
                                    }`}
                            >
                                <VisualProfileIdentityGroup
                                    profile={profile}
                                    isPreview={isPreview}
                                    heroEnabled
                                    alignmentOverride={identityAlignment}
                                    primaryColor={heroPrimary}
                                    secondaryColor={heroSecondary}
                                    showAvatar={showAvatar}
                                    showName={showName}
                                    showUsername={showUsername}
                                    showBio={showBio}
                                    showLocation={showLocation}
                                    showSocials={showSocials}
                                    showStats={showStats}
                                    onSocialClick={onSocialClick}
                                />
                            </div>
                        )}
                    </VisualProfileHero>
                )}

                {/* TOP BAR */}
                <div
                    className={`${heroEnabled
                        ? "absolute left-0 right-0 top-0 z-30"
                        : "relative z-30"
                        } linkzzz-page-horizontal`}
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
                    className="linkzzz-page-horizontal"
                    style={{
                        paddingBottom: isPreview ? "20px" : `${verticalPadding}px`,
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
                                        ? `-${heroAvatarOverlap}px`
                                        : isPreview
                                            ? "28px"
                                            : "36px",
                            }}
                        >
                            <VisualProfileIdentityGroup
                                profile={profile}
                                isPreview={isPreview}
                                heroEnabled={heroEnabled}
                                primaryColor={appearance.primaryTextColor}
                                secondaryColor={appearance.secondaryTextColor}
                                showAvatar={showAvatar}
                                showName={showName}
                                showUsername={showUsername}
                                showBio={showBio}
                                showLocation={showLocation}
                                showSocials={showSocials}
                                showStats={showStats}
                                onSocialClick={onSocialClick}
                            />
                        </div>
                    )}

                    {/* BENTO / MASONRY */}
                    <div className="linkzzz-section-gap-top">
                        <BentoGrid
                            gap={
                                cardGap
                            }
                            mobileColumns={mobileColumns}
                        >
                            {visibleLinks.map(
                                    ({ link, state }) => (
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
                                                    focusedLink?.id === link.id ? focusedLink : link
                                                }
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
                                        </BentoGridItem>
                                    ),
                                )}
                        </BentoGrid>
                    </div>

                    {profile.contentBlocks.length > 0 && (
                        <div className="linkzzz-section-gap-top">
                            <PageContentBlocks profile={profile} isPreview={isPreview} nowMs={nowMs} />
                        </div>
                    )}

                    <div className="linkzzz-footer-gap">
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
