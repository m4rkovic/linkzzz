export const DEFAULT_ASSET_STORAGE_QUOTA_BYTES = 512 * 1024 * 1024;

export function getAssetStorageQuotaBytes(
  configured = process.env.ASSET_STORAGE_QUOTA_BYTES,
) {
  if (!configured) return DEFAULT_ASSET_STORAGE_QUOTA_BYTES;

  const parsed = Number(configured);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return DEFAULT_ASSET_STORAGE_QUOTA_BYTES;
  }
  return parsed;
}

export type AssetStorageQuotaDecision = {
  allowed: boolean;
  limitBytes: number;
  usedBytes: number;
  requestedBytes: number;
  remainingBytes: number;
  reason?: "ASSET_STORAGE_QUOTA_EXCEEDED";
};

export function canStoreAssetBytes(
  usedBytes: number,
  requestedBytes: number,
  limitBytes = getAssetStorageQuotaBytes(),
): AssetStorageQuotaDecision {
  const normalizedUsed = Math.max(0, Math.trunc(usedBytes));
  const normalizedRequested = Math.max(0, Math.trunc(requestedBytes));
  const normalizedLimit = Math.max(1, Math.trunc(limitBytes));
  const remainingBytes = Math.max(0, normalizedLimit - normalizedUsed);

  if (normalizedUsed + normalizedRequested > normalizedLimit) {
    return {
      allowed: false,
      limitBytes: normalizedLimit,
      usedBytes: normalizedUsed,
      requestedBytes: normalizedRequested,
      remainingBytes,
      reason: "ASSET_STORAGE_QUOTA_EXCEEDED",
    };
  }

  return {
    allowed: true,
    limitBytes: normalizedLimit,
    usedBytes: normalizedUsed,
    requestedBytes: normalizedRequested,
    remainingBytes,
  };
}

export class AssetStorageQuotaError extends Error {
  readonly code = "ASSET_STORAGE_QUOTA_EXCEEDED" as const;

  constructor(
    readonly limitBytes: number,
    readonly usedBytes: number,
    readonly requestedBytes: number,
  ) {
    super("The account asset storage quota has been exceeded.");
    this.name = "AssetStorageQuotaError";
  }
}
