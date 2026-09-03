import assert from "node:assert/strict";
import test from "node:test";

import type { RuntimeSmartLinkRepository } from "../src/server/persistence/dependencies";
import type { PrismaSmartLinkRepository } from "../src/server/persistence/prisma/repositories/smart-link-repository";

type ForbiddenSmartLinkMutation =
  | "create"
  | "duplicateForUser"
  | "deleteIfRevision";

type ForbiddenRuntimeMethod = Extract<
  keyof RuntimeSmartLinkRepository,
  ForbiddenSmartLinkMutation
>;
type ForbiddenPrismaMethod = Extract<
  keyof PrismaSmartLinkRepository,
  ForbiddenSmartLinkMutation
>;

type AssertNever<T extends never> = T;
type RuntimeSmartLinkRepositoryMustNotExposeBypasses = AssertNever<ForbiddenRuntimeMethod>;
type PrismaSmartLinkRepositoryMustNotImplementBypasses = AssertNever<ForbiddenPrismaMethod>;

void (0 as unknown as RuntimeSmartLinkRepositoryMustNotExposeBypasses);
void (0 as unknown as PrismaSmartLinkRepositoryMustNotImplementBypasses);

test("runtime SmartLink repository exposes reads plus guarded mutation paths", () => {
  const allowedMethods: Array<keyof RuntimeSmartLinkRepository> = [
    "listForUser",
    "countForUser",
    "findByIdForUser",
    "findBySlug",
    "createWithinLimit",
    "updateIfRevision",
    "duplicateForUserWithinLimit",
  ];

  assert.deepEqual(allowedMethods, [
    "listForUser",
    "countForUser",
    "findByIdForUser",
    "findBySlug",
    "createWithinLimit",
    "updateIfRevision",
    "duplicateForUserWithinLimit",
  ]);
});
