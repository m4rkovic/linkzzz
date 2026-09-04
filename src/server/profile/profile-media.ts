import "server-only";

import { getAssetStorage } from "@/server/assets/storage-factory";
import type { AssetRepository } from "@/server/services/contracts";
import type { PersistedProfileData } from "@/types/persisted-profile";

export type ProfileAssetReference = {
  id: string;
  type: "AVATAR" | "COVER" | "LINK_IMAGE";
};

type ProfileMediaDependencies = {
  assets?: AssetRepository;
};

export function collectProfileAssetReferences(
  profile: PersistedProfileData,
): ProfileAssetReference[] {
  const references: ProfileAssetReference[] = [];

  if (profile.avatarAssetId) {
    references.push({ id: profile.avatarAssetId, type: "AVATAR" });
  }
  if (profile.coverAssetId) {
    references.push({ id: profile.coverAssetId, type: "COVER" });
  }

  for (const link of profile.links) {
    if (link.imageAssetId) {
      references.push({ id: link.imageAssetId, type: "LINK_IMAGE" });
    }
  }

  for (const block of profile.contentBlocks) {
    if (block.type !== "GALLERY") continue;
    for (const image of block.images) {
      if (image.imageAssetId) {
        references.push({ id: image.imageAssetId, type: "LINK_IMAGE" });
      }
    }
  }

  return references;
}

export function preserveUnpersistedProfileMedia(
  incoming: PersistedProfileData,
  current: PersistedProfileData | null,
): PersistedProfileData {
  const currentLinks = new Map(current?.links.map((link) => [link.id, link]));
  const currentBlocks = new Map(
    current?.contentBlocks.map((block) => [block.id, block]),
  );

  return {
    ...incoming,
    avatarUrl: resolveMediaUrl(incoming.avatarUrl, current?.avatarUrl),
    coverImageUrl: resolveMediaUrl(
      incoming.coverImageUrl,
      current?.coverImageUrl,
    ),
    links: incoming.links.map((link) => ({
      ...link,
      imageUrl: resolveMediaUrl(
        link.imageUrl,
        currentLinks.get(link.id)?.imageUrl,
      ),
    })),
    contentBlocks: incoming.contentBlocks.map((block) => {
      if (block.type !== "GALLERY") return block;

      const currentBlock = currentBlocks.get(block.id);
      const currentImages =
        currentBlock?.type === "GALLERY"
          ? new Map(currentBlock.images.map((image) => [image.id, image]))
          : new Map<string, never>();

      return {
        ...block,
        images: block.images.map((image) => ({
          ...image,
          imageUrl: resolveMediaUrl(
            image.imageUrl,
            currentImages.get(image.id)?.imageUrl,
          ),
        })),
      };
    }),
  };
}

export async function cleanupReplacedSmartLinkAssets(
  userId: string,
  smartLinkId: string,
  previous: PersistedProfileData | null,
  next: PersistedProfileData,
  dependencies: ProfileMediaDependencies,
) {
  if (!previous || !dependencies.assets) return;

  const candidates = getRemovedAssetIds(previous, next);
  if (!candidates.length) return;

  const removed = await dependencies.assets.deleteUnusedForSmartLink(
    userId,
    smartLinkId,
    candidates,
  );
  await removeStoredAssets(removed);
}

function getRemovedAssetIds(
  previous: PersistedProfileData,
  next: PersistedProfileData,
) {
  const previousIds = new Set(
    collectProfileAssetReferences(previous).map((reference) => reference.id),
  );
  const nextIds = new Set(
    collectProfileAssetReferences(next).map((reference) => reference.id),
  );

  return [...previousIds].filter((id) => !nextIds.has(id));
}

async function removeStoredAssets(
  assets: Array<{ storageKey: string }>,
): Promise<void> {
  if (!assets.length) return;

  try {
    const storage = await getAssetStorage();
    await Promise.allSettled(
      assets.map((asset) => storage.remove(asset.storageKey)),
    );
  } catch {
    // Database references are authoritative. A storage sweep can retry orphans later.
  }
}

function resolveMediaUrl(
  incoming: string | undefined,
  current: string | undefined,
) {
  if (incoming?.startsWith("blob:")) return current;
  return incoming;
}
