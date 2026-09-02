"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
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
  | { ok: false; error: string; code?: "PROFILE_CONFLICT" };

type ProfileContextValue = {
  profile: PublicProfileData;
  setProfile: Dispatch<SetStateAction<PublicProfileData>>;
  saveProfile: (profileOverride?: PublicProfileData) => Promise<SaveProfileResult>;
  saving: boolean;
  dirty: boolean;
  pageLinkLimit: number;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  children,
  initialProfile,
  initialRevision,
  saveEndpoint,
  assetSmartLinkId,
  pageLinkLimit,
}: {
  children: ReactNode;
  initialProfile: PersistedProfileData;
  initialRevision: number;
  saveEndpoint: string;
  assetSmartLinkId?: string;
  pageLinkLimit: number;
}) {
  const hydratedInitialProfile = useMemo(
    () => hydrateProfile(initialProfile),
    [initialProfile],
  );
  const [profile, setProfile] = useState<PublicProfileData>(
    hydratedInitialProfile,
  );
  const [savedProfile, setSavedProfile] = useState<PublicProfileData>(
    hydratedInitialProfile,
  );
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(
    () => profileFingerprint(profile) !== profileFingerprint(savedProfile),
    [profile, savedProfile],
  );
  const revisionRef = useRef(initialRevision);

  async function saveProfile(
    profileOverride?: PublicProfileData,
  ): Promise<SaveProfileResult> {
    const profileToSave = profileOverride ?? profile;
    const uploadedAssetIds: string[] = [];
    setSaving(true);

    try {
      const persistedProfile = await persistProfileMedia(
        profileToSave,
        uploadedAssetIds,
        assetSmartLinkId,
      );
      const response = await fetch(saveEndpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: serializeProfile(persistedProfile),
          revision: revisionRef.current,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            code?: string;
            profile?: PersistedProfileData;
            revision?: number;
          }
        | null;

      if (!response.ok) {
        await cleanupUploadedAssets(uploadedAssetIds, assetSmartLinkId);
        return {
          ok: false,
          error: payload?.error ?? "Could not save profile.",
          code:
            payload?.code === "PROFILE_CONFLICT"
              ? "PROFILE_CONFLICT"
              : undefined,
        };
      }

      if (
        !payload?.profile ||
        !Number.isSafeInteger(payload.revision) ||
        Number(payload.revision) < 1
      ) {
        await cleanupUploadedAssets(uploadedAssetIds, assetSmartLinkId);
        return { ok: false, error: "Server returned an invalid profile revision." };
      }

      const savedProfile = hydrateProfile(payload.profile);
      revisionRef.current = payload.revision as number;
      revokeReplacedBlobUrls(profileToSave, savedProfile);
      setProfile(savedProfile);
      setSavedProfile(savedProfile);
      return { ok: true };
    } catch {
      await cleanupUploadedAssets(uploadedAssetIds, assetSmartLinkId);
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
      value={{ profile, setProfile, saveProfile, saving, dirty, pageLinkLimit }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

function profileFingerprint(profile: PublicProfileData) {
  return JSON.stringify(serializeProfile(profile));
}

async function persistProfileMedia(
  profile: PublicProfileData,
  uploadedAssetIds: string[],
  smartLinkId?: string,
): Promise<PublicProfileData> {
  const next = {
    ...profile,
    links: profile.links.map((link) => ({ ...link })),
    contentBlocks: profile.contentBlocks.map((block) =>
      block.type === "GALLERY"
        ? { ...block, images: block.images.map((image) => ({ ...image })) }
        : { ...block },
    ),
  };
  if (!next.avatarUrl) next.avatarAssetId = undefined;
  else if (next.avatarUrl.startsWith("blob:")) {
    const uploaded = await uploadBlob(next.avatarUrl, "AVATAR", "avatar.jpg", smartLinkId);
    next.avatarUrl = uploaded.url;
    next.avatarAssetId = uploaded.assetId;
    uploadedAssetIds.push(uploaded.assetId);
  }
  if (!next.coverImageUrl) next.coverAssetId = undefined;
  else if (next.coverImageUrl.startsWith("blob:")) {
    const uploaded = await uploadBlob(next.coverImageUrl, "COVER", "cover.jpg", smartLinkId);
    next.coverImageUrl = uploaded.url;
    next.coverAssetId = uploaded.assetId;
    uploadedAssetIds.push(uploaded.assetId);
  }
  for (const link of next.links) {
    if (!link.imageUrl) link.imageAssetId = undefined;
    else if (link.imageUrl.startsWith("blob:")) {
      const uploaded = await uploadBlob(
        link.imageUrl,
        "LINK_IMAGE",
        "link-image.jpg",
        smartLinkId,
      );
      link.imageUrl = uploaded.url;
      link.imageAssetId = uploaded.assetId;
      uploadedAssetIds.push(uploaded.assetId);
    }
  }
  for (const block of next.contentBlocks) {
    if (block.type !== "GALLERY") continue;
    for (const image of block.images) {
      if (!image.imageUrl) image.imageAssetId = undefined;
      else if (image.imageUrl.startsWith("blob:")) {
        const uploaded = await uploadBlob(
          image.imageUrl,
          "LINK_IMAGE",
          "gallery-image.jpg",
          smartLinkId,
        );
        image.imageUrl = uploaded.url;
        image.imageAssetId = uploaded.assetId;
        uploadedAssetIds.push(uploaded.assetId);
      }
    }
  }
  return next;
}

async function uploadBlob(
  url: string,
  type: "AVATAR" | "COVER" | "LINK_IMAGE",
  fallbackName: string,
  smartLinkId?: string,
) {
  const blob = await fetch(url).then((response) => response.blob());
  const form = new FormData();
  form.set("file", new File([blob], fallbackName, { type: blob.type }));
  form.set("type", type);
  if (smartLinkId) form.set("smartLinkId", smartLinkId);
  const response = await fetch("/api/assets/images", { method: "POST", body: form });
  const payload = await response.json().catch(() => null) as {
    assetId?: string;
    url?: string;
    error?: string;
  } | null;
  if (!response.ok || !payload?.url || !payload.assetId) {
    throw new Error(payload?.error ?? "Image upload failed.");
  }
  return { url: payload.url, assetId: payload.assetId };
}

async function cleanupUploadedAssets(assetIds: string[], smartLinkId?: string) {
  if (!assetIds.length) return;
  await fetch("/api/assets/images", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetIds, smartLinkId }),
  }).catch(() => undefined);
}

function revokeReplacedBlobUrls(before: PublicProfileData, after: PublicProfileData) {
  const blockUrls = (profile: PublicProfileData) => profile.contentBlocks.flatMap((block) =>
    block.type === "GALLERY" ? block.images.map((image) => image.imageUrl) : [],
  );
  const urls = [before.avatarUrl, before.coverImageUrl, ...before.links.map((link) => link.imageUrl), ...blockUrls(before)];
  const retained = new Set([after.avatarUrl, after.coverImageUrl, ...after.links.map((link) => link.imageUrl), ...blockUrls(after)]);
  for (const url of urls) if (url?.startsWith("blob:") && !retained.has(url)) URL.revokeObjectURL(url);
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }

  return context;
}
