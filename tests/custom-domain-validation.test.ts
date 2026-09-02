import assert from "node:assert/strict";
import test from "node:test";

import { getCustomDomainRoutingTarget, normalizeCustomDomain } from "@/server/domains/custom-domain-validation";

const env = {
  LINKZZZ_APP_HOSTS: "linkzzz.com,www.linkzzz.com",
  LINKZZZ_CUSTOM_DOMAIN_TARGET: "domains.linkzzz.com",
} as unknown as NodeJS.ProcessEnv;

test("custom domains normalize public hostnames", () => {
  assert.equal(normalizeCustomDomain(" Links.Example.COM. ", env), "links.example.com");
  assert.equal(normalizeCustomDomain("bücher.example", env), "xn--bcher-kva.example");
});

test("custom domains reject URLs, localhost and the Linkzzz namespace", () => {
  assert.throws(() => normalizeCustomDomain("https://example.com", env));
  assert.throws(() => normalizeCustomDomain("localhost", env));
  assert.throws(() => normalizeCustomDomain("foo.linkzzz.com", env));
});

test("custom domain routing target is a hostname", () => {
  assert.equal(getCustomDomainRoutingTarget(env), "domains.linkzzz.com");
  assert.throws(() => getCustomDomainRoutingTarget({
    LINKZZZ_CUSTOM_DOMAIN_TARGET: "http://domains.linkzzz.com",
  } as unknown as NodeJS.ProcessEnv));
});
