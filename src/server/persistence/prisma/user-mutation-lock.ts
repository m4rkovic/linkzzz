import "server-only";

import type { Prisma } from "@/generated/prisma/client";

/**
 * Serialize quota-sensitive mutations for one customer across app instances.
 *
 * This is a PostgreSQL transaction-scoped advisory lock. It is deliberately
 * keyed only by userId so SmartLink quota writes and later subscription/plan
 * mutations can share the same lock boundary without adding schema state.
 */
export async function lockUserMutation(
  transaction: Prisma.TransactionClient,
  userId: string,
) {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 1280199500))
  `;
}
