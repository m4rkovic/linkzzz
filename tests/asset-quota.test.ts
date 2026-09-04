import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_ASSET_STORAGE_QUOTA_BYTES,
  canStoreAssetBytes,
  getAssetStorageQuotaBytes,
} from "@/server/business/asset-quota";

test("asset storage quota allows an upload that fits exactly", () => {
  assert.deepEqual(canStoreAssetBytes(90, 10, 100), {
    allowed: true,
    limitBytes: 100,
    usedBytes: 90,
    requestedBytes: 10,
    remainingBytes: 10,
  });
});

test("asset storage quota rejects uploads beyond the per-user limit", () => {
  assert.deepEqual(canStoreAssetBytes(90, 11, 100), {
    allowed: false,
    limitBytes: 100,
    usedBytes: 90,
    requestedBytes: 11,
    remainingBytes: 10,
    reason: "ASSET_STORAGE_QUOTA_EXCEEDED",
  });
});

test("invalid asset quota configuration falls back to the safe default", () => {
  assert.equal(getAssetStorageQuotaBytes("not-a-number"), DEFAULT_ASSET_STORAGE_QUOTA_BYTES);
  assert.equal(getAssetStorageQuotaBytes("0"), DEFAULT_ASSET_STORAGE_QUOTA_BYTES);
});
