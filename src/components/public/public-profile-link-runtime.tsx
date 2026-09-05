"use client";

import {
  hasCampaignSchedule,
  pinLinkFirst,
  resolvePinnedLinkId,
} from "@/features/engagement/profile-engagement";
import {
  hasLinkSchedule,
  isLinkRendered,
  resolveLinkAvailability,
} from "@/features/links/link-availability";
import { isLinkDimmed, useFocusHighlight } from "@/features/links/use-focus-highlight";
import { useScheduleClock } from "@/features/scheduling/use-schedule-clock";
import { trackSmartLinkExternalEvent } from "@/components/public/smart-link-tracking";
import PublicClassicLinkButton from "@/components/public/public-classic-link-button";
import { BentoGrid, BentoGridItem } from "@/components/public/bento-grid";
import { VisualLinkCard } from "@/components/public/visual-link-card";
import { resolveVisualProfileLayout } from "@/components/public/visual-profile-layout";
import type { PublicProfileData } from "@/types/profile";
import type { TrackingConfig } from "@/types/smart-link";

type PublicProfileLinkRuntimeProps = {
  profile: PublicProfileData;
  layout: "classic" | "visual";
  tracking: TrackingConfig;
  initialNowMs: number;
};

export default function PublicProfileLinkRuntime({
  profile,
  layout,
  tracking,
  initialNowMs,
}: PublicProfileLinkRuntimeProps) {
  const scheduleClockEnabled =
    profile.links.some(hasLinkSchedule) || hasCampaignSchedule(profile.engagement);
  const nowMs = useScheduleClock(scheduleClockEnabled, initialNowMs);
  const visibleLinks = pinLinkFirst(
    profile.links
      .map((link) => ({ link, state: resolveLinkAvailability(link, nowMs) }))
      .filter(({ state }) => isLinkRendered(state)),
    resolvePinnedLinkId(profile, nowMs),
  );
  const focusedLink = useFocusHighlight(profile, false, nowMs);

  function trackClick(linkId: string) {
    trackSmartLinkExternalEvent(tracking, "destination_click", linkId);
  }

  if (layout === "classic") {
    return (
      <div
        className="linkzzz-section-gap-top"
        style={{ display: "grid", gap: `${profile.appearance.buttonSpacing}px` }}
      >
        {visibleLinks.map(({ link, state }) => (
          <PublicClassicLinkButton
            key={link.id}
            profile={profile}
            link={focusedLink?.id === link.id ? focusedLink : link}
            isPreview={false}
            onClick={() => trackClick(link.id)}
            focused={focusedLink?.id === link.id}
            dimmed={isLinkDimmed(focusedLink, link)}
            disabled={state === "EXPIRED_DISABLED"}
          />
        ))}
      </div>
    );
  }

  const { cardGap, mobileColumns } = resolveVisualProfileLayout(profile);
  return (
    <div className="linkzzz-section-gap-top">
      <BentoGrid gap={cardGap} mobileColumns={mobileColumns}>
        {visibleLinks.map(({ link, state }) => (
          <BentoGridItem key={link.id} link={link} gap={cardGap}>
            <VisualLinkCard
              profile={profile}
              link={focusedLink?.id === link.id ? focusedLink : link}
              isPreview={false}
              onClick={() => trackClick(link.id)}
              focused={focusedLink?.id === link.id}
              dimmed={isLinkDimmed(focusedLink, link)}
              disabled={state === "EXPIRED_DISABLED"}
            />
          </BentoGridItem>
        ))}
      </BentoGrid>
    </div>
  );
}
