"use client";

import PageContentBlocks from "@/components/public/page-content-blocks";
import { hasScheduleWindow } from "@/features/scheduling/schedule";
import { useScheduleClock } from "@/features/scheduling/use-schedule-clock";
import type { PublicProfileData } from "@/types/profile";

export default function PublicProfileContentRuntime({
  profile,
  initialNowMs,
}: {
  profile: PublicProfileData;
  initialNowMs: number;
}) {
  const scheduleClockEnabled = profile.contentBlocks.some(
    (block) => block.visible && (block.type === "COUNTDOWN" || hasScheduleWindow(block)),
  );
  const nowMs = useScheduleClock(scheduleClockEnabled, initialNowMs);

  return <PageContentBlocks profile={profile} isPreview={false} nowMs={nowMs} />;
}
