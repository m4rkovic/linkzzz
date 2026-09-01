"use client";

import { useEffect, useMemo, useState } from "react";

import ProfileRenderer from "@/components/public/profile-renderer";
import { hydrateProfile } from "@/features/profile/profile-serialization";

import type { PersistedProfileData } from "@/types/persisted-profile";

type PublicProfileProps = {
  initialProfile: PersistedProfileData;
};

export default function PublicProfile({
  initialProfile,
}: PublicProfileProps) {
  const profile = useMemo(
    () => hydrateProfile(initialProfile),
    [initialProfile],
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    trackAnalyticsEvent(profile.slug, "PAGE_VIEW");
  }, [profile.slug]);

  function trackLinkClick(linkId: string) {
    trackAnalyticsEvent(profile.slug, "LINK_CLICK", linkId);
  }

  function trackSocialClick(socialId: string) {
    trackAnalyticsEvent(profile.slug, "SOCIAL_CLICK", socialId);
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
      <ProfileRenderer
        profile={profile}
        mode="public"
        onShare={shareProfile}
        onLinkClick={trackLinkClick}
        onSocialClick={trackSocialClick}
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

function trackAnalyticsEvent(slug: string, type: "PAGE_VIEW" | "LINK_CLICK" | "SOCIAL_CLICK", linkId?: string) {
  let visitorId: string | undefined;
  try {
    visitorId = window.localStorage.getItem("linkzzz_visitor_id") ?? crypto.randomUUID();
    window.localStorage.setItem("linkzzz_visitor_id", visitorId);
  } catch {
    visitorId = undefined;
  }
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug, type, linkId, visitorId }),
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}
