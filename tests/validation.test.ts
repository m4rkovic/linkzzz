import assert from "node:assert/strict";
import test from "node:test";

import { getPasswordRuleResults, validatePassword } from "@/server/validation/password";
import { normalizeSlug, validateSlug } from "@/server/validation/slug";

test("password policy requires every locked security rule", () => {
  assert.equal(validatePassword("weak").ok, false);
  assert.deepEqual(
    getPasswordRuleResults("SecurePass1!").filter((rule) => !rule.passed),
    [],
  );
  assert.deepEqual(validatePassword("SecurePass1!"), {
    ok: true,
    value: "SecurePass1!",
  });
});

test("slug validation normalizes valid values and rejects reserved routes", () => {
  assert.equal(normalizeSlug("  Sky-Hook  "), "sky-hook");
  assert.deepEqual(validateSlug("  Sky-Hook  "), {
    ok: true,
    value: "sky-hook",
  });
  assert.equal(validateSlug("admin").ok, false);
  assert.equal(validateSlug("change-password").ok, false);
  assert.equal(validateSlug("_next").ok, false);
  assert.deepEqual(validateSlug("creator_name_with_underscore"), { ok: true, value: "creator_name_with_underscore" });
  assert.equal(validateSlug("not valid").ok, false);
});
