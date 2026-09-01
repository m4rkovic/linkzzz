export type StoredAsset = {
  fileName: string;
  storageKey: string;
  publicUrl: string;
};

export interface AssetStorage {
  storeImage(ownerKey: string, bytes: Uint8Array, mimeType: string): Promise<StoredAsset>;
  remove(storageKey: string): Promise<void>;
}

const MIME_EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function validateImage(bytes: Uint8Array, mimeType: string) {
  const extension = MIME_EXTENSIONS.get(mimeType);
  if (!extension || !hasValidSignature(bytes, mimeType)) {
    throw new Error("Unsupported or invalid image file.");
  }
  return extension;
}

function hasValidSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  if (mimeType === "image/png") return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (mimeType === "image/webp") return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  return false;
}
