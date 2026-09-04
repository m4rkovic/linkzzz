export const PENDING_DOMAIN_CLAIM_TTL_MS = 72 * 60 * 60 * 1_000;
export const DOMAIN_REVERIFICATION_INTERVAL_MS = 30 * 24 * 60 * 60 * 1_000;

type DomainLifecycleRecord = {
  status: "PENDING" | "VERIFIED" | "ACTIVE" | "DISABLED";
  verifiedAt?: Date | null;
  updatedAt: Date;
};

export function getPendingDomainClaimExpiry(record: DomainLifecycleRecord) {
  if (record.status !== "PENDING") return null;
  return new Date(record.updatedAt.getTime() + PENDING_DOMAIN_CLAIM_TTL_MS);
}

export function isPendingDomainClaimExpired(
  record: DomainLifecycleRecord,
  now = new Date(),
) {
  const expiresAt = getPendingDomainClaimExpiry(record);
  return Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
}

export function getDomainReverificationDueAt(record: DomainLifecycleRecord) {
  if (!record.verifiedAt) return null;
  return new Date(
    record.verifiedAt.getTime() + DOMAIN_REVERIFICATION_INTERVAL_MS,
  );
}

export function isCustomDomainVerificationCurrent(
  record: DomainLifecycleRecord,
  now = new Date(),
) {
  const dueAt = getDomainReverificationDueAt(record);
  return Boolean(dueAt && dueAt.getTime() > now.getTime());
}
