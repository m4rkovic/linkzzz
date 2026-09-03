import assert from "node:assert/strict";
import test from "node:test";

import type { RuntimeSmartLinkRepository } from "../src/server/persistence/dependencies";

type ForbiddenRuntimeMethod = Extract<
  keyof RuntimeSmartLinkRepository,
  "create" | "duplicateForUser" | "deleteIfRevision" | "countForUser"
>;

type AssertNever<T extends never> = T;
type RuntimeSmartLinkRepositoryMustNotExposeBypasses = AssertNever<ForbiddenRuntimeMethod>;

void (0 as unknown as RuntimeSmartLinkRepositoryMustNotExposeBypasses);

test("runtime SmartLink repository exposes only guarded mutation paths", () => {
  const allowedMethods: Array<keyof RuntimeSmartLinkRepository> = [
    "listForUser",
    "findByIdForUser",
    "findBySlug",
    "createWithinLimit",
    "updateIfRevision",
    "duplicateForUserWithinLimit",
  ];

  assert.deepEqual(allowedMethods, [
    "listForUser",
    "findByIdForUser",
    "findBySlug",
    "createWithinLimit",
    "updateIfRevision",
    "duplicateForUserWithinLimit",
  ]);
});
