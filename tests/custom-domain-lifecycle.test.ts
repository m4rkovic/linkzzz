import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAIN_REVERIFICATION_INTERVAL_MS,
  getDomainReverificationDueAt,
  getPendingDomainClaimExpiry,
  isCustomDomainVerificationCurrent,
  isPendingDomainClaimExpired,
  PENDING_DOMAIN_CLAIM_TTL_MS,
} from "@/server/domains/custom-domain-lifecycle";

const NOW = new Date("2026-09-04T12:00:00.000Z");

test("pending domain claims expire after the fixed reservation window", () => {
  const pending = {
    status: "PENDING" as const,
    verifiedAt: null,
    updatedAt: new Date(NOW.getTime() - PENDING_DOMAIN_CLAIM_TTL_MS),
  };

  assert.equal(getPendingDomainClaimExpiry(pending)?.toISOString(), NOW.toISOString());
  assert.equal(isPendingDomainClaimExpired(pending, NOW), true);
  assert.equal(
    isPendingDomainClaimExpired(
      { ...pending, updatedAt: new Date(pending.updatedAt.getTime() + 1) },
      NOW,
    ),
    false,
  );
});

test("verified domains require a fresh ownership check every 30 days", () => {
  const active = {
    status: "ACTIVE" as const,
    verifiedAt: new Date(NOW.getTime() - DOMAIN_REVERIFICATION_INTERVAL_MS),
    updatedAt: NOW,
  };

  assert.equal(getDomainReverificationDueAt(active)?.toISOString(), NOW.toISOString());
  assert.equal(isCustomDomainVerificationCurrent(active, NOW), false);
  assert.equal(
    isCustomDomainVerificationCurrent(
      { ...active, verifiedAt: new Date(active.verifiedAt.getTime() + 1) },
      NOW,
    ),
    true,
  );
});
