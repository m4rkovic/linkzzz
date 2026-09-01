import "server-only";

import type { AssetStorage } from "@/server/assets/asset-storage";

let storage: AssetStorage | undefined;

export async function getAssetStorage(): Promise<AssetStorage> {
  if (storage) return storage;
  const adapter = process.env.ASSET_STORAGE_ADAPTER ?? (process.env.NODE_ENV === "production" ? "s3" : "local");
  if (adapter === "local") {
    const { localAssetStorage } = await import("@/server/assets/local-asset-storage");
    return storage = localAssetStorage;
  }
  if (adapter !== "s3") throw new Error("Unsupported asset storage adapter.");
  const { S3AssetStorage } = await import("@/server/assets/s3-asset-storage");
  return storage = new S3AssetStorage({
    endpoint: required("S3_ENDPOINT"),
    bucket: required("S3_BUCKET"),
    region: process.env.S3_REGION || "auto",
    accessKeyId: required("S3_ACCESS_KEY_ID"),
    secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    publicBaseUrl: required("S3_PUBLIC_BASE_URL"),
  });
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required asset storage setting: ${name}.`);
  return value;
}
