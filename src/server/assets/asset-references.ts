const ASSET_ID_KEY = /AssetId$/;

/**
 * Extract asset references from persisted JSON without coupling cleanup to one
 * particular block type. Unknown future blocks are treated conservatively: a
 * value that looks like an asset id protects the referenced row from cleanup.
 */
export function collectAssetIdsFromJson(value: unknown): Set<string> {
  const ids = new Set<string>();
  const visited = new Set<object>();

  visit(value);
  return ids;

  function visit(candidate: unknown) {
    if (!candidate || typeof candidate !== "object") return;
    if (visited.has(candidate)) return;
    visited.add(candidate);

    if (Array.isArray(candidate)) {
      for (const item of candidate) visit(item);
      return;
    }

    for (const [key, child] of Object.entries(candidate)) {
      if (ASSET_ID_KEY.test(key) && typeof child === "string" && child) {
        ids.add(child);
      }
      visit(child);
    }
  }
}
