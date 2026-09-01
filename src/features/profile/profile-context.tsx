"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  hydrateProfile,
  serializeProfile,
} from "@/features/profile/profile-serialization";

import type { PersistedProfileData } from "@/types/persisted-profile";
import type { PublicProfileData } from "@/types/profile";

type SaveProfileResult =
  | { ok: true }
  | { ok: false; error: string };

type ProfileContextValue = {
  profile: PublicProfileData;
  setProfile: Dispatch<SetStateAction<PublicProfileData>>;
  saveProfile: (profileOverride?: PublicProfileData) => Promise<SaveProfileResult>;
  saving: boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  children,
  initialProfile,
}: {
  children: ReactNode;
  initialProfile: PersistedProfileData;
}) {
  const hydratedInitialProfile = useMemo(
    () => hydrateProfile(initialProfile),
    [initialProfile],
  );
  const [profile, setProfile] = useState<PublicProfileData>(
    hydratedInitialProfile,
  );
  const [saving, setSaving] = useState(false);

  async function saveProfile(
    profileOverride?: PublicProfileData,
  ): Promise<SaveProfileResult> {
    const profileToSave = profileOverride ?? profile;
    setSaving(true);

    try {
      const persistedProfile = await persistProfileMedia(profileToSave);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serializeProfile(persistedProfile)),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        return {
          ok: false,
          error: payload?.error ?? "Could not save profile.",
        };
      }

      revokeReplacedBlobUrls(profileToSave, persistedProfile);
      setProfile(persistedProfile);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Could not connect to the Linkzzz server.",
      };
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProfileContext.Provider
      value={{ profile, setProfile, saveProfile, saving }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

async function persistProfileMedia(profile: PublicProfileData): Promise<PublicProfileData> {
  const next = { ...profile, links: profile.links.map((link) => ({ ...link })) };
  if (next.avatarUrl?.startsWith("blob:")) next.avatarUrl = await uploadBlob(next.avatarUrl, "AVATAR", "avatar.jpg");
  if (next.coverImageUrl?.startsWith("blob:")) next.coverImageUrl = await uploadBlob(next.coverImageUrl, "COVER", "cover.jpg");
  for (const link of next.links) if (link.imageUrl?.startsWith("blob:")) link.imageUrl = await uploadBlob(link.imageUrl, "LINK_IMAGE", "link-image.jpg");
  return next;
}

async function uploadBlob(url: string, type: "AVATAR" | "COVER" | "LINK_IMAGE", fallbackName: string) {
  const blob = await fetch(url).then((response) => response.blob());
  const form = new FormData();
  form.set("file", new File([blob], fallbackName, { type: blob.type }));
  form.set("type", type);
  const response = await fetch("/api/assets/images", { method: "POST", body: form });
  const payload = await response.json().catch(() => null) as { url?: string; error?: string } | null;
  if (!response.ok || !payload?.url) throw new Error(payload?.error ?? "Image upload failed.");
  return payload.url;
}

function revokeReplacedBlobUrls(before: PublicProfileData, after: PublicProfileData) {
  const urls = [before.avatarUrl, before.coverImageUrl, ...before.links.map((link) => link.imageUrl)];
  const retained = new Set([after.avatarUrl, after.coverImageUrl, ...after.links.map((link) => link.imageUrl)]);
  for (const url of urls) if (url?.startsWith("blob:") && !retained.has(url)) URL.revokeObjectURL(url);
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }

  return context;
}
