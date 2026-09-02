"use client";

import { useMemo, useState } from "react";

import ProfileRenderer from "@/components/public/profile-renderer";
import SmartLinkTracking, { trackSmartLinkExternalEvent } from "@/components/public/smart-link-tracking";
import { hydrateProfile } from "@/features/profile/profile-serialization";

import type { PersistedProfileData } from "@/types/persisted-profile";
import type { TrackingConfig } from "@/types/smart-link";

type PublicProfileProps = {
  initialProfile: PersistedProfileData;
  tracking: TrackingConfig;
  initialNowMs: number;
};

export default function PublicProfile({
  initialProfile,
  tracking,
  initialNowMs,
}: PublicProfileProps) {
  const profile = useMemo(
    () => hydrateProfile(initialProfile),
    [initialProfile],
  );
  const [copied, setCopied] = useState(false);

  function trackLinkClick(linkId: string) {
    trackSmartLinkExternalEvent(tracking, "destination_click", linkId);
  }

  function trackSocialClick(socialId: string) {
    trackSmartLinkExternalEvent(tracking, "social_click", socialId);
  }

  async function shareProfile() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.displayName,
          text: profile.bio,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy profile link:", url);
    }
  }

  return (
    <>
      <SmartLinkTracking tracking={tracking} />
      <ProfileRenderer
        profile={profile}
        mode="public"
        onShare={shareProfile}
        onLinkClick={trackLinkClick}
        onSocialClick={trackSocialClick}
        initialNowMs={initialNowMs}
      />

      {copied && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-xl ring-1 ring-white/10"
        >
          Profile link copied
        </div>
      )}
    </>
  );
}
