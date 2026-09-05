"use client";

import { useEffect, useState } from "react";

import PublicProfileShareButton from "@/components/public/public-profile-share";
import UserContentImage from "@/components/ui/user-content-image";
import { addAlpha, getAvatarRadius, getInitials } from "@/components/public/profile-renderer-utils";
import type { PublicProfileData } from "@/types/profile";

export default function PublicVisualStickyHeader({
  profile,
  identityId,
}: {
  profile: PublicProfileData;
  identityId: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = document.getElementById(identityId);
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const rootTop = entry.rootBounds?.top ?? 0;
        const passedTop = entry.boundingClientRect.bottom <= rootTop + 12;
        setVisible(!entry.isIntersecting && passedTop);
      },
      { threshold: [0, 0.15, 0.5] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [identityId]);

  const appearance = profile.appearance;
  return (
    <div className="sticky top-0 z-50 h-0">
      <div
        className={`border-b backdrop-blur-2xl transition-all duration-300 ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0"
        }`}
        style={{
          backgroundColor: addAlpha(appearance.backgroundColor, 0.9),
          borderColor: addAlpha(appearance.primaryTextColor, 0.12),
          color: appearance.primaryTextColor,
        }}
      >
        <div className="flex min-h-[68px] items-center gap-3 px-4">
          <StickyAvatar profile={profile} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold sm:text-base">
              {profile.displayName}
            </p>
            {profile.username ? (
              <p
                className="mt-0.5 truncate text-[11px]"
                style={{ color: appearance.secondaryTextColor }}
              >
                @{profile.username}
              </p>
            ) : null}
          </div>
          <PublicProfileShareButton
            title={profile.displayName}
            text={profile.bio}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition hover:scale-105"
            style={{
              borderColor: addAlpha(appearance.primaryTextColor, 0.14),
              backgroundColor: addAlpha(appearance.primaryTextColor, 0.06),
              color: appearance.primaryTextColor,
            }}
            iconSize={16}
          />
        </div>
      </div>
    </div>
  );
}

function StickyAvatar({ profile }: { profile: PublicProfileData }) {
  const size = 42;
  const radius = getAvatarRadius(
    profile.appearance.identity?.avatarShape ?? "circle",
  );

  if (profile.avatarUrl) {
    return (
      <div
        className="shrink-0 overflow-hidden border border-white/15"
        style={{ height: size, width: size, borderRadius: radius }}
      >
        <UserContentImage
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center border border-white/15 bg-zinc-950 text-xs font-black text-white"
      style={{ height: size, width: size, borderRadius: radius }}
    >
      {getInitials(profile.displayName)}
    </div>
  );
}
