import assert from "node:assert/strict";
import test from "node:test";

import {
  getDestinationProvider,
  isDestinationProviderId,
  normalizeProviderDestination,
} from "@/features/destinations/provider-registry";
import { validateDestinationConfig } from "@/server/smart-links/smart-link-validation";

test("provider registry recognizes configured providers and rejects invented ones", () => {
  assert.equal(isDestinationProviderId("instagram"), true);
  assert.equal(isDestinationProviderId("APPLE_MUSIC"), true);
  assert.equal(isDestinationProviderId("SPOTIFYLOL"), false);
  assert.equal(getDestinationProvider("instagram").name, "Instagram");
});

test("friendly social handles normalize to canonical URLs", () => {
  const instagram = normalizeProviderDestination("INSTAGRAM", "@skyhookband");
  assert.equal(instagram.ok, true);
  if (instagram.ok) assert.equal(instagram.value.url, "https://www.instagram.com/skyhookband");

  const youtube = normalizeProviderDestination("YOUTUBE", "@skyhookband");
  assert.equal(youtube.ok, true);
  if (youtube.ok) assert.equal(youtube.value.url, "https://www.youtube.com/@skyhookband");
});

test("contact providers normalize without allowing dangerous schemes", () => {
  const whatsapp = normalizeProviderDestination("WHATSAPP", "+381 60 123 4567");
  assert.equal(whatsapp.ok, true);
  if (whatsapp.ok) assert.equal(whatsapp.value.url, "https://wa.me/381601234567");

  const email = normalizeProviderDestination("EMAIL", "hello@example.com");
  assert.equal(email.ok, true);
  if (email.ok) assert.equal(email.value.url, "mailto:hello@example.com");

  const custom = normalizeProviderDestination("CUSTOM", "javascript:alert(1)");
  assert.equal(custom.ok, false);
});

test("server destination validation canonicalizes friendly values", () => {
  const result = validateDestinationConfig({
    provider: "instagram",
    value: "@skyhookband",
    url: "",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.provider, "INSTAGRAM");
    assert.equal(result.value.url, "https://www.instagram.com/skyhookband");
    assert.equal(result.value.label, "Instagram");
  }
});
