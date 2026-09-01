"use client";

import ProfileRenderer from "@/components/public/profile-renderer";
import type { PublicProfileData, VisitorLocation } from "@/types/profile";

type ProfilePreviewFrameProps = {
  profile: PublicProfileData;
  visitor?: VisitorLocation;
  title?: string;
  subtitle?: string;
  badge?: string;
};

export default function ProfilePreviewFrame({
  profile,
  visitor,
  title = "Live preview",
  subtitle = "Changes update instantly",
  badge,
}: ProfilePreviewFrameProps) {
  return (
    <aside className="w-full min-w-0 max-w-full">
      <div className="2xl:sticky 2xl:top-28">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{title}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-400">{subtitle}</p>
          </div>

          {badge && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {badge}
            </span>
          )}
        </div>

        <div className="mx-auto w-full min-w-0 max-w-[390px] overflow-hidden rounded-[28px] border-[6px] border-zinc-950 bg-zinc-950 shadow-2xl sm:rounded-[34px] sm:border-[8px] 2xl:max-w-none">
          <div className="h-[600px] w-full min-w-0 overflow-y-auto overflow-x-hidden sm:h-[680px] 2xl:h-[720px]">
            <ProfileRenderer profile={profile} visitor={visitor} mode="preview" />
          </div>
        </div>
      </div>
    </aside>
  );
}
