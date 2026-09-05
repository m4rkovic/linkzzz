import assert from "node:assert/strict";
import test from "node:test";

import { collectAssetIdsFromJson } from "@/server/assets/asset-references";

test("asset reference collection protects known ids in any persisted block shape", () => {
  const ids = collectAssetIdsFromJson({
    type: "FUTURE_MEDIA_BLOCK",
    avatarAssetId: "avatar-1",
    nested: [{ imageAssetId: "gallery-1" }, { coverAssetId: "cover-1" }],
  });

  assert.deepEqual([...ids].sort(), ["avatar-1", "cover-1", "gallery-1"]);
});

test("asset reference collection ignores ordinary strings", () => {
  assert.deepEqual([...collectAssetIdsFromJson({ imageUrl: "/uploads/image.png", title: "imageAssetId" })], []);
});
