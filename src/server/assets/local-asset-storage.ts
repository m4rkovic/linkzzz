import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { validateImage, type AssetStorage } from "@/server/assets/asset-storage";

export async function storeLocalImage(profileKey: string, bytes: Uint8Array, mimeType: string) {
  const extension = validateImage(bytes, mimeType);
  const directory = path.join(process.cwd(), "public", "uploads", profileKey);
  const fileName = `${randomUUID()}.${extension}`;
  const storageKey = path.posix.join("uploads", profileKey, fileName);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), bytes, { flag: "wx" });
  return { fileName, storageKey, publicUrl: `/${storageKey}` };
}

export async function removeLocalImage(storageKey: string) {
  const target = path.resolve(process.cwd(), "public", storageKey);
  const root = path.resolve(process.cwd(), "public", "uploads");
  if (!target.startsWith(`${root}${path.sep}`)) return;
  await unlink(target).catch(() => undefined);
}

export const localAssetStorage: AssetStorage = {
  storeImage: storeLocalImage,
  remove: removeLocalImage,
};
