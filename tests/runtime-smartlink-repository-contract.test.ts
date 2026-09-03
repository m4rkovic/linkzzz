import assert from "node:assert/strict";
import test from "node:test";

import type { RuntimeSmartLinkRepository } from "../src/server/persistence/dependencies";

type ForbiddenRuntimeMethod = Extract<
  keyof RuntimeSmartLinkRepository,
  "create" | "duplicateForUser" | "deleteIfRevision"
>;

type AssertNever<T extends never> = T;
type RuntimeSmartLinkRepositoryMustNotExposeBypasses = AssertNever<ForbiddenRuntimeMethod>;

void (0 as unknown as RuntimeSmartLinkRepositoryMustNotExposeBypasses);

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
