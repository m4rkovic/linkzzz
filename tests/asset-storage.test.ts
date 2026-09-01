import assert from "node:assert/strict";
import test from "node:test";

import { validateImage } from "@/server/assets/asset-storage";

test("asset validation accepts supported image signatures", () => {
  assert.equal(validateImage(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), "image/png"), "png");
  assert.equal(validateImage(Uint8Array.from([0xff,0xd8,0xff,0xd9]), "image/jpeg"), "jpg");
  assert.equal(validateImage(new TextEncoder().encode("RIFF0000WEBP"), "image/webp"), "webp");
});

test("asset validation rejects spoofed and unsupported content", () => {
  assert.throws(() => validateImage(new TextEncoder().encode("not a png"), "image/png"));
  assert.throws(() => validateImage(new TextEncoder().encode("<svg></svg>"), "image/svg+xml"));
});
