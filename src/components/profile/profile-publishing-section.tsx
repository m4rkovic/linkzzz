"use client";

import { useState } from "react";
import {
  ExternalLink,
  Globe2,
  ShieldAlert,
  Unplug,
} from "lucide-react";

import { useProfile } from "@/features/profile/profile-context";

import type { ProfileStatus } from "@/types/profile";

export default function ProfilePublishingSection() {
  const { profile, setProfile, saveProfile, saving } = useProfile();
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: ProfileStatus) {
    const nextProfile = {
      ...profile,
      status: nextStatus,
    };

    setError("");
    setProfile(nextProfile);

    const result = await saveProfile(nextProfile);

    if (!result.ok) {
      setProfile(profile);
      setError(result.error);
    }
  }

  const isPublished = profile.status === "PUBLISHED";
  const isDisabled = profile.status === "DISABLED";

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-950">Publishing</h2>
            <StatusBadge status={profile.status} />
          </div>

          <p className="mt-1 max-w-xl break-words text-sm leading-6 text-zinc-500">
            Control whether visitors can open your public Linkzzz profile.
            Dashboard previews stay available while the profile is in draft.
          </p>
        </div>

        <a
          href={`/${profile.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto"
        >
          <ExternalLink size={16} />
          Open public page
        </a>
      </div>

      {isDisabled ? (
        <div className="mt-6 flex min-w-0 gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <ShieldAlert className="mt-0.5 shrink-0" size={19} />

          <div className="min-w-0">
            <p className="text-sm font-semibold">Profile disabled by admin</p>
            <p className="mt-1 break-words text-sm leading-6 text-amber-800">
              Publishing controls are locked until an administrator re-enables
              the profile.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex min-w-0 flex-col gap-4 rounded-2xl bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isPublished
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-zinc-200 text-zinc-600"
              }`}
            >
              {isPublished ? <Globe2 size={18} /> : <Unplug size={18} />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">
                {isPublished ? "Your profile is live" : "Your profile is private"}
              </p>

              <p className="mt-1 break-words text-xs leading-5 text-zinc-500">
                {isPublished ? (
                  <>
                    Visitors can open <span className="break-all">linkzzz.com/{profile.slug}</span>.
                  </>
                ) : (
                  "Visitors see an unavailable profile page until you publish."
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => updateStatus(isPublished ? "DRAFT" : "PUBLISHED")}
            className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 md:w-auto ${
              isPublished
                ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                : "bg-zinc-950 text-white hover:bg-zinc-800"
            }`}
          >
            {saving
              ? "Saving..."
              : isPublished
                ? "Unpublish"
                : "Publish profile"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 break-words text-xs font-medium leading-5 text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: ProfileStatus }) {
  const classes =
    status === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "DISABLED"
        ? "bg-amber-50 text-amber-700"
        : "bg-zinc-100 text-zinc-600";

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${classes}`}>
      {status}
    </span>
  );
}
