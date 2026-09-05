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

  assert.match(policy, /script-src 'self' 'nonce-nonce-value' 'strict-dynamic'/);
  assert.match(policy, /https:\/\/www\.googletagmanager\.com/);
  assert.match(policy, /https:\/\/connect\.facebook\.net/);
  assert.doesNotMatch(policy, /'unsafe-inline'/);
});

test("production marketing CSP disables JavaScript instead of weakening script-src", () => {
  const policy = buildStaticMarketingContentSecurityPolicy({
    isDevelopment: false,
  });

  assert.match(policy, /script-src 'none'/);
  assert.doesNotMatch(policy, /nonce-/);
  assert.doesNotMatch(policy, /'unsafe-inline'/);
  assert.doesNotMatch(policy, /'unsafe-eval'/);
});

test("development marketing CSP keeps the Next dev runtime available", () => {
  const policy = buildStaticMarketingContentSecurityPolicy({
    isDevelopment: true,
  });

  assert.match(policy, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.match(policy, /connect-src 'self' ws: wss:/);
});
