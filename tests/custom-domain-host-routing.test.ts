import assert from "node:assert/strict";
import test from "node:test";

import {
  getConfiguredApplicationHosts,
  getRequestHostname,
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
