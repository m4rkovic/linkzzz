"use client";

import { useState, type ChangeEvent } from "react";
import {
  ImagePlus,
  Link2,
  Save,
  UserRound,
} from "lucide-react";

import ProfilePublishingSection from "@/components/profile/profile-publishing-section";
import ProfileStatsEditor from "@/components/profile/profile-stats-editor";
import SocialLinksEditor from "@/components/profile/social-links-editor";
import ProfilePreviewFrame from "@/components/ui/profile-preview-frame";
import UserContentImage from "@/components/ui/user-content-image";
import { useToast } from "@/components/ui/toast";
import { useProfile } from "@/features/profile/profile-context";

import type {
  PublicProfileData,
  VisitorLocation,
} from "@/types/profile";

const mockVisitor: VisitorLocation = {
  countryCode: "RS",
  countryName: "Serbia",
  flag: "🇷🇸",
};

export default function ProfileEditor({
  smartLinkScoped = false,
  showPreview = true,
}: {
  smartLinkScoped?: boolean;
  showPreview?: boolean;
}) {
  const { profile, setProfile, saveProfile, saving, dirty } = useProfile();
  const { pushToast } = useToast();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  function updateProfile(values: Partial<PublicProfileData>) {
    setProfile((current) => ({
      ...current,
      ...values,
    }));
  }

  function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setProfile((current) => {
      if (current.avatarUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.avatarUrl);
      }

      return {
        ...current,
        avatarUrl: objectUrl,
      };
    });

    event.target.value = "";
  }

  function handleSlugChange(value: string) {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    updateProfile({ slug: normalized });
  }

  async function saveChanges() {
    setSaved(false);
    setSaveError("");

    const result = await saveProfile();

    if (!result.ok) {
      setSaveError(result.error);
      pushToast({ title: "Profile save failed", description: result.error, tone: "error" });
      return;
    }

    setSaved(true);
    pushToast({ title: "Profile saved", tone: "success" });
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className={`grid w-full min-w-0 max-w-full gap-6 ${showPreview ? "2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-8" : ""}`}>
      <div className="min-w-0 space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-violet-strong">
                Profile editor
              </p>
              <p aria-live="polite" className="mt-1 text-xs font-semibold">
                {saved && <span className="text-emerald-700">Changes saved.</span>}
                {saveError && <span className="text-red-700">{saveError}</span>}
                {!saved && !saveError && (
                  <span className={dirty ? "text-amber-700" : "text-zinc-500"}>
                    {dirty ? "Unsaved profile changes" : "All profile changes are saved"}
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={saveChanges}
              disabled={saving || !dirty}
              className="flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-lime px-5 text-sm font-black text-zinc-950 shadow-[0_8px_24px_rgba(200,255,77,0.22)] transition hover:bg-brand-lime-strong disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>

        {!smartLinkScoped && <ProfilePublishingSection />}

        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Profile image
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Upload an image for your public profile.
            </p>
          </div>

          <div className="mt-6 flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-950 text-xl font-bold text-white">
              {profile.avatarUrl ? (
                <UserContentImage
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(profile.displayName)
              )}
            </div>

            <div className="min-w-0 flex-1">
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
                <ImagePlus size={17} />
                Upload image

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>

              <p className="mt-3 text-xs leading-5 text-zinc-400">
                JPG, PNG or WEBP. Square image recommended.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Profile information
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Basic information shown on your public profile.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="display-name"
                className="flex items-center gap-2 text-sm font-medium text-zinc-900"
              >
                <UserRound size={15} className="text-zinc-400" />
                Display name
              </label>

              <input
                id="display-name"
                type="text"
                value={profile.displayName}
                onChange={(event) =>
                  updateProfile({ displayName: event.target.value })
                }
                maxLength={60}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
              />

              <div className="mt-1.5 text-right text-xs text-zinc-400">
                {profile.displayName.length} / 60
              </div>
            </div>

            {!smartLinkScoped && (
              <div>
                <label
                  htmlFor="profile-slug"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-900"
                >
                  <Link2 size={15} className="text-zinc-400" />
                  Profile URL
                </label>

                <div className="mt-2 flex overflow-hidden rounded-xl border border-zinc-200 bg-white focus-within:border-zinc-400">
                  <span className="hidden items-center border-r border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-500 sm:flex">
                    linkzzz.com/
                  </span>

                  <input
                    id="profile-slug"
                    type="text"
                    value={profile.slug}
                    onChange={(event) => handleSlugChange(event.target.value)}
                    className="min-w-0 flex-1 px-4 py-3 text-sm text-zinc-950 outline-none"
                  />
                </div>

                <p className="mt-2 break-all text-xs text-zinc-400 sm:hidden">
                  linkzzz.com/{profile.slug}
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="profile-bio"
                  className="text-sm font-medium text-zinc-900"
                >
                  Bio
                </label>

                <span className="text-xs text-zinc-400">
                  {profile.bio.length} / 160
                </span>
              </div>

              <textarea
                id="profile-bio"
                value={profile.bio}
                onChange={(event) =>
                  updateProfile({ bio: event.target.value })
                }
                maxLength={160}
                rows={5}
                className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-zinc-400"
              />
            </div>
          </div>
        </section>

        <SocialLinksEditor />
        <ProfileStatsEditor />

      </div>

      {showPreview && (
        <ProfilePreviewFrame
          profile={profile}
          visitor={mockVisitor}
          badge={profile.status === "PUBLISHED" ? "Live" : "Preview"}
        />
      )}
    </div>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LZ"
  );
}
