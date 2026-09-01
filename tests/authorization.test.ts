import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorizationError,
  requireAdmin,
  requireResourceOwner,
} from "@/server/auth/guards";
import type { AuthenticatedPrincipal } from "@/server/types/auth";

const customer: AuthenticatedPrincipal = {
  userId: "customer-1",
  role: "CUSTOMER",
  accountStatus: "ACTIVE",
};
const admin: AuthenticatedPrincipal = {
  userId: "admin-1",
  role: "ADMIN",
  accountStatus: "ACTIVE",
};

test("only an active administrator passes the admin guard", () => {
  assert.equal(requireAdmin(admin), admin);
  assert.throws(() => requireAdmin(customer), AuthorizationError);
  assert.throws(
    () => requireAdmin({ ...admin, accountStatus: "SUSPENDED" }),
    (error) => error instanceof AuthorizationError && error.code === "ACCOUNT_UNAVAILABLE",
  );
});

test("customers can access only owned resources while admins can access any", () => {
  assert.equal(requireResourceOwner(customer, "customer-1"), customer);
  assert.throws(
    () => requireResourceOwner(customer, "customer-2"),
    (error) => error instanceof AuthorizationError && error.code === "FORBIDDEN",
  );
  assert.equal(requireResourceOwner(admin, "customer-2"), admin);
});
