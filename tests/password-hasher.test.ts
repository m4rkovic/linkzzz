import assert from "node:assert/strict";
import test from "node:test";

import {
  DUMMY_LOGIN_PASSWORD_HASH,
  ScryptPasswordHasher,
} from "@/server/auth/password-hasher";

test("password hashing uses a salted scrypt hash and constant-time verification", async () => {
  const hasher = new ScryptPasswordHasher();
  const first = await hasher.hash("SecurePass1!");
  const second = await hasher.hash("SecurePass1!");

  assert.match(first, /^scrypt\$/);
  assert.match(first, /^scrypt\$32768\$8\$3\$/);
  assert.notEqual(first, second);
  assert.equal(await hasher.verify("SecurePass1!", first), true);
  assert.equal(await hasher.verify("WrongPass1!", first), false);
  assert.equal(await hasher.verify("SecurePass1!", "invalid-hash"), false);
  assert.equal(hasher.needsRehash(first), false);
  assert.equal(
    hasher.needsRehash(first.replace("scrypt$32768$8$3$", "scrypt$16384$8$1$")),
    true,
  );
});

test("unknown-login dummy hash uses the current password policy", async () => {
  const hasher = new ScryptPasswordHasher();

  assert.equal(hasher.needsRehash(DUMMY_LOGIN_PASSWORD_HASH), false);
  assert.equal(
    await hasher.verify("an-attacker-supplied-password", DUMMY_LOGIN_PASSWORD_HASH),
    false,
  );
});
