import "server-only";

import { getAssetStorage } from "@/server/assets/storage-factory";
import { getServerDependencies } from "@/server/persistence/dependencies";

export type OrphanSweepResult = {
  deletedAssets: number;
  storageRemovalFailures: number;
};

export async function sweepOrphanedAssets(
  limit = 200,
  actorUserId?: string,
): Promise<OrphanSweepResult> {
  const dependencies = await getServerDependencies();
  if (!dependencies.assets) {
    return { deletedAssets: 0, storageRemovalFailures: 0 };
  }

  const removed = await dependencies.assets.deleteOrphaned(limit);
  if (!removed.length) return { deletedAssets: 0, storageRemovalFailures: 0 };

  let storageRemovalFailures = 0;
  try {
    const storage = await getAssetStorage();
    const results = await Promise.allSettled(
      removed.map((asset) => storage.remove(asset.storageKey)),
    );
    storageRemovalFailures = results.filter((result) => result.status === "rejected").length;
  } catch {
    storageRemovalFailures = removed.length;
  }

  const result = { deletedAssets: removed.length, storageRemovalFailures };
  if (actorUserId) {
    await dependencies.audit.write({
      actorUserId,
      action: "ASSET_ORPHAN_SWEEP",
      resourceType: "ASSET",
      metadata: result,
    });
  }
  return result;
}
