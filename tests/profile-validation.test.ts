import assert from "node:assert/strict";
import test from "node:test";

import { defaultAppearance } from "@/config/profile-defaults";
import { validateProfilePayload } from "@/server/profile/profile-validation";
import type { PersistedProfileData } from "@/types/persisted-profile";

function profile(): PersistedProfileData {
  return {
    slug: "creator-demo",
    displayName: " Creator Demo ",
    username: " creator ",
    bio: "Profile bio",
    avatarUrl: "https://example.com/avatar.png",
    avatarAssetId: "avatar-1",
    coverImageUrl: "https://example.com/cover.png",
    coverAssetId: "cover-1",
    locationLabel: " Belgrade ",
    status: "PUBLISHED",
    stats: [{ id: "stat-1", value: "42", label: "Releases", visible: true }],
    socials: [
      {
        id: "social-1",
        name: "Website",
        url: "https://example.com/social",
        visible: true,
        platform: "website",
      },
    ],
    links: [
      {
        id: "link-1",
        title: "Featured link",
        description: "Description",
        url: "https://example.com/default",
        visible: true,
        platform: "website",
        layout: "featured",
        aspectRatio: "landscape",
        imageUrl: "https://example.com/card.png",
        imageAssetId: "card-asset-1",
        imageAlt: "Card image",
        imageFit: "cover",
        imagePosition: "center",
        showPlatformIcon: true,
        showTitle: true,
        showDescription: true,
        overlayEnabled: true,
        overlayOpacity: 0.4,
        titlePosition: "bottom-left",
        customStyle: {
          enabled: true,
          backgroundType: "solid",
          backgroundColor: "#111111",
        },
        availability: {
          visibleFrom: "2026-09-01T00:00:00.000Z",
          visibleUntil: "2026-09-30T00:00:00.000Z",
          expiryAction: "HIDE",
        },
        sensitiveContent: {
          enabled: true,
          title: "Sensitive content",
          message: "Please confirm before continuing.",
          continueLabel: "Continue",
        },
        geo: {
          enabled: true,
          fallback: "SHOW",
          rules: [
            {
              id: "geo-de",
              countryCode: "DE",
              countryName: "Germany",
              action: "REDIRECT",
              destination: {
                provider: "CUSTOM",
                value: "https://example.com/de",
                url: "https://example.com/de",
                fallbackUrl: "https://example.com/fallback",
                deeplinkOverrides: {
                  android: "example://android",
                  ios: "example://ios",
                },
              },
            },
          ],
        },
        geoDestinations: [
          {
            id: "legacy-de",
            countryCode: "DE",
            countryName: "Germany",
            url: "https://example.com/de",
          },
        ],
      },
    ],
    contentBlocks: [
      {
        id: "gallery-1",
        type: "GALLERY",
        visible: true,
        title: "Gallery",
        columns: 2,
        aspectRatio: "square",
        images: [
          {
            id: "image-1",
            imageUrl: "https://example.com/gallery.png",
            imageAssetId: "gallery-asset-1",
            alt: "Gallery image",
          },
        ],
      },
    ],
    engagement: {
      featuredLinkId: "link-1",
      campaign: {
        enabled: true,
        primaryLinkId: "link-1",
        pinPrimary: true,
        focusEffect: "glow",
        dimSiblings: true,
        focusColor: "#ffffff",
        visibleFrom: "2026-09-01T00:00:00.000Z",
        visibleUntil: "2026-09-30T00:00:00.000Z",
      },
      visitorMessaging: {
        activeIndicator: "STATIC_ACTIVE",
        responseTime: "CUSTOM",
        customResponseTime: "Usually within two hours",
      },
    },
    appearance: structuredClone(defaultAppearance),
  };
}

test("profile payload parser removes unknown fields at every persistence boundary", () => {
  const payload = profile() as unknown as Record<string, unknown>;
  payload.internalRole = "ADMIN";

  const appearance = payload.appearance as Record<string, unknown>;
  appearance.privateThemeToken = "secret";
  for (const key of ["page", "hero", "identity", "cards"] as const) {
    (appearance[key] as Record<string, unknown>).internal = true;
  }

  const link = (payload.links as Array<Record<string, unknown>>)[0]!;
  link.icon = "server-component";
  link.internal = true;
  (link.customStyle as Record<string, unknown>).internal = true;
  (link.availability as Record<string, unknown>).internal = true;
  (link.sensitiveContent as Record<string, unknown>).internal = true;
  const geo = link.geo as Record<string, unknown>;
  geo.internal = true;
  const rule = (geo.rules as Array<Record<string, unknown>>)[0]!;
  rule.internal = true;
  const destination = rule.destination as Record<string, unknown>;
  destination.internal = true;
  (destination.deeplinkOverrides as Record<string, unknown>).internal = true;
  ((link.geoDestinations as Array<Record<string, unknown>>)[0]!).internal = true;

  const social = (payload.socials as Array<Record<string, unknown>>)[0]!;
  social.icon = "server-component";
  social.internal = true;
  ((payload.stats as Array<Record<string, unknown>>)[0]!).internal = true;

  const block = (payload.contentBlocks as Array<Record<string, unknown>>)[0]!;
  block.internal = true;
  ((block.images as Array<Record<string, unknown>>)[0]!).internal = true;

  const engagement = payload.engagement as Record<string, unknown>;
  engagement.internal = true;
  (engagement.campaign as Record<string, unknown>).internal = true;
  (engagement.visitorMessaging as Record<string, unknown>).internal = true;

  const result = validateProfilePayload(payload);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.displayName, "Creator Demo");
  assert.equal(result.value.username, "creator");
  assert.equal(result.value.locationLabel, "Belgrade");
  assertNoUnknownFields(result.value as unknown as Record<string, unknown>);
});

test("profile payload parser keeps all supported nested values", () => {
  const result = validateProfilePayload(profile());
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.appearance.hero?.contentPosition, "bottom-center");
  assert.equal(result.value.links[0]?.customStyle?.backgroundColor, "#111111");
  assert.equal(
    result.value.links[0]?.geo?.rules[0]?.destination?.deeplinkOverrides?.ios,
    "example://ios",
  );
  assert.equal(result.value.contentBlocks[0]?.type, "GALLERY");
  assert.equal(result.value.engagement?.campaign?.focusEffect, "glow");
  assert.equal(
    result.value.engagement?.visitorMessaging?.customResponseTime,
    "Usually within two hours",
  );
});

function assertNoUnknownFields(value: Record<string, unknown>) {
  assert.equal("internalRole" in value, false);

  const appearance = value.appearance as Record<string, unknown>;
  assert.equal("privateThemeToken" in appearance, false);
  for (const key of ["page", "hero", "identity", "cards"] as const) {
    assert.equal("internal" in (appearance[key] as Record<string, unknown>), false);
  }

  const link = (value.links as Array<Record<string, unknown>>)[0]!;
  assert.equal("icon" in link, false);
  assert.equal("internal" in link, false);
  assert.equal("internal" in (link.customStyle as Record<string, unknown>), false);
  assert.equal("internal" in (link.availability as Record<string, unknown>), false);
  assert.equal("internal" in (link.sensitiveContent as Record<string, unknown>), false);
  const geo = link.geo as Record<string, unknown>;
  assert.equal("internal" in geo, false);
  const rule = (geo.rules as Array<Record<string, unknown>>)[0]!;
  assert.equal("internal" in rule, false);
  const destination = rule.destination as Record<string, unknown>;
  assert.equal("internal" in destination, false);
  assert.equal(
    "internal" in (destination.deeplinkOverrides as Record<string, unknown>),
    false,
  );
  assert.equal(
    "internal" in (link.geoDestinations as Array<Record<string, unknown>>)[0]!,
    false,
  );

  const social = (value.socials as Array<Record<string, unknown>>)[0]!;
  assert.equal("icon" in social, false);
  assert.equal("internal" in social, false);
  assert.equal(
    "internal" in (value.stats as Array<Record<string, unknown>>)[0]!,
    false,
  );

  const block = (value.contentBlocks as Array<Record<string, unknown>>)[0]!;
  assert.equal("internal" in block, false);
  assert.equal(
    "internal" in (block.images as Array<Record<string, unknown>>)[0]!,
    false,
  );

  const engagement = value.engagement as Record<string, unknown>;
  assert.equal("internal" in engagement, false);
  assert.equal("internal" in (engagement.campaign as Record<string, unknown>), false);
  assert.equal(
    "internal" in (engagement.visitorMessaging as Record<string, unknown>),
    false,
  );
}
