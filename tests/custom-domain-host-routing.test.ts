import assert from "node:assert/strict";
import test from "node:test";

import {
  getConfiguredApplicationHosts,
  getRequestHostname,
  isAllowedCustomDomainPath,
  isApplicationHostname,
  isReservedPlatformHostname,
  normalizeRequestHostname,
} from "@/server/domains/host-routing";

test("host routing normalizes ports, forwarded lists and IDN hostnames", () => {
  assert.equal(normalizeRequestHostname("Example.COM:443"), "example.com");
  assert.equal(normalizeRequestHostname("example.com, proxy.internal"), "example.com");
  assert.equal(normalizeRequestHostname("bücher.example"), "xn--bcher-kva.example");
});

test("application hosts and their platform namespace stay reserved", () => {
  const env = {
    LINKZZZ_APP_HOSTS: "linkzzz.com,www.linkzzz.com",
  } as unknown as NodeJS.ProcessEnv;
  assert.deepEqual(getConfiguredApplicationHosts(env), ["linkzzz.com", "www.linkzzz.com"]);
  assert.equal(isApplicationHostname("linkzzz.com", env), true);
  assert.equal(isReservedPlatformHostname("foo.linkzzz.com", env), true);
  assert.equal(isReservedPlatformHostname("example.com", env), false);
});

test("forwarded host is ignored unless explicitly trusted", () => {
  const headers = new Headers({ host: "linkzzz.com", "x-forwarded-host": "customer.example" });
  assert.equal(
    getRequestHostname(
      headers,
      { LINKZZZ_TRUST_PROXY_HEADERS: "0" } as unknown as NodeJS.ProcessEnv,
    ),
    "linkzzz.com",
  );
  assert.equal(
    getRequestHostname(
      headers,
      { LINKZZZ_TRUST_PROXY_HEADERS: "1" } as unknown as NodeJS.ProcessEnv,
    ),
    "customer.example",
  );
});

test("custom domains expose only the public runtime surface", () => {
  assert.equal(isAllowedCustomDomainPath("/"), true);
  assert.equal(isAllowedCustomDomainPath("/skyhook/out/card/card-1"), true);
  assert.equal(isAllowedCustomDomainPath("/skyhook/out/social/social-1"), true);
  assert.equal(isAllowedCustomDomainPath("/skyhook/out/block/cta-1"), true);
  assert.equal(isAllowedCustomDomainPath("/api/analytics/events"), true);
  assert.equal(isAllowedCustomDomainPath("/api/public/smart-links/skyhook/leads"), true);
  assert.equal(isAllowedCustomDomainPath("/_next/webpack-hmr"), true);
  assert.equal(isAllowedCustomDomainPath("/uploads/avatar.webp"), true);

  assert.equal(isAllowedCustomDomainPath("/login"), false);
  assert.equal(isAllowedCustomDomainPath("/dashboard"), false);
  assert.equal(isAllowedCustomDomainPath("/admin"), false);
  assert.equal(isAllowedCustomDomainPath("/api/auth/login"), false);
  assert.equal(isAllowedCustomDomainPath("/api/admin/users"), false);
  assert.equal(isAllowedCustomDomainPath("/api/smart-links"), false);
  assert.equal(isAllowedCustomDomainPath("/api/assets"), false);
  assert.equal(isAllowedCustomDomainPath("/api/custom-domains"), false);
  assert.equal(isAllowedCustomDomainPath("/another-users-slug"), false);
  assert.equal(isAllowedCustomDomainPath("/anything-else"), false);
});
