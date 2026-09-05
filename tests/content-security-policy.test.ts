import assert from "node:assert/strict";
import test from "node:test";

import {
  buildContentSecurityPolicy,
  buildStaticMarketingContentSecurityPolicy,
} from "../src/server/security/content-security-policy";

test("dynamic CSP keeps nonce-based script execution", () => {
  const policy = buildContentSecurityPolicy({
    nonce: "nonce-value",
    isDevelopment: false,
  });
  const scriptSrc = directive(policy, "script-src");

  assert.match(scriptSrc, /script-src 'self' 'nonce-nonce-value' 'strict-dynamic'/);
  assert.match(scriptSrc, /https:\/\/www\.googletagmanager\.com/);
  assert.match(scriptSrc, /https:\/\/connect\.facebook\.net/);
  assert.doesNotMatch(scriptSrc, /'unsafe-inline'/);
  assert.match(directive(policy, "style-src"), /'unsafe-inline'/);
});

test("production marketing CSP disables JavaScript instead of weakening script-src", () => {
  const policy = buildStaticMarketingContentSecurityPolicy({
    isDevelopment: false,
  });
  const scriptSrc = directive(policy, "script-src");

  assert.equal(scriptSrc, "script-src 'none'");
  assert.doesNotMatch(scriptSrc, /nonce-/);
  assert.doesNotMatch(scriptSrc, /'unsafe-inline'/);
  assert.doesNotMatch(scriptSrc, /'unsafe-eval'/);
  assert.match(directive(policy, "style-src"), /'unsafe-inline'/);
});

test("development marketing CSP keeps the Next dev runtime available", () => {
  const policy = buildStaticMarketingContentSecurityPolicy({
    isDevelopment: true,
  });

  assert.match(
    directive(policy, "script-src"),
    /script-src 'self' 'unsafe-inline' 'unsafe-eval'/,
  );
  assert.match(directive(policy, "connect-src"), /connect-src 'self' ws: wss:/);
});

function directive(policy: string, name: string) {
  return (
    policy
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name} `)) ?? ""
  );
}
