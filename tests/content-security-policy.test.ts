import assert from "node:assert/strict";
import test from "node:test";

import { buildContentSecurityPolicy } from "@/server/security/content-security-policy";

test("production CSP allows only nonce-authorized inline scripts", () => {
  const policy = buildContentSecurityPolicy({
    nonce: "test-nonce",
    isDevelopment: false,
  });

  assert.match(
    policy,
    /script-src 'self' 'nonce-test-nonce' 'strict-dynamic'/,
  );
  assert.match(policy, /script-src-attr 'none'/);
  assert.doesNotMatch(scriptDirective(policy), /'unsafe-inline'/);
  assert.doesNotMatch(scriptDirective(policy), /'unsafe-eval'/);
  assert.match(policy, /upgrade-insecure-requests/);
});

test("development CSP permits only the eval support required by Next development", () => {
  const policy = buildContentSecurityPolicy({
    nonce: "development-nonce",
    isDevelopment: true,
  });

  assert.match(scriptDirective(policy), /'nonce-development-nonce'/);
  assert.match(scriptDirective(policy), /'unsafe-eval'/);
  assert.doesNotMatch(scriptDirective(policy), /'unsafe-inline'/);
  assert.doesNotMatch(policy, /upgrade-insecure-requests/);
});

function scriptDirective(policy: string) {
  return policy
    .split("; ")
    .find((directive) => directive.startsWith("script-src ")) ?? "";
}
