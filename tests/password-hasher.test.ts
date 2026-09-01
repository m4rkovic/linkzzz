import assert from "node:assert/strict";
import test from "node:test";

import { ScryptPasswordHasher } from "@/server/auth/password-hasher";

test("password hashing uses a salted scrypt hash and constant-time verification", async () => {
  const hasher = new ScryptPasswordHasher();
  const first = await hasher.hash("SecurePass1!");
  const second = await hasher.hash("SecurePass1!");

  assert.match(first, /^scrypt\$/);
  assert.notEqual(first, second);
  assert.equal(await hasher.verify("SecurePass1!", first), true);
  assert.equal(await hasher.verify("WrongPass1!", first), false);
  assert.equal(await hasher.verify("SecurePass1!", "invalid-hash"), false);
});
