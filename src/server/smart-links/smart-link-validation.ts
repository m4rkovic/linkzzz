import { validateSlug } from "@/server/validation/slug";
import {
  getDestinationProvider,
  isDestinationProviderId,
  normalizeProviderDestination,
} from "@/features/destinations/provider-registry";
import type {
  DeeplinkConfig,
  DestinationConfig,
  GeoAction,
  GeoConfig,
  ShieldConfig,
  SmartLinkEditableData,
  SmartLinkStatus,
  SmartLinkType,
  TrackingConfig,
} from "@/types/smart-link";

export function validateSmartLinkEditable(
  value: unknown,
  type: SmartLinkType,
): { ok: true; value: SmartLinkEditableData } | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Invalid link payload." };
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.title !== "string") {
    return { ok: false, message: "Link title is required." };
  }
  const title = raw.title.trim();
  if (!title || title.length > 120) {
    return { ok: false, message: "Link title must contain between 1 and 120 characters." };
  }
  if (typeof raw.slug !== "string") {
    return { ok: false, message: "Link slug is required." };
  }
  const slug = validateSlug(raw.slug);
  if (!slug.ok) return { ok: false, message: slug.error };

  const status = validateStatus(raw.status);
  if (!status) {
    return { ok: false, message: "Link status must be DRAFT or PUBLISHED." };
  }

  const destination = raw.primaryDestination == null
    ? { ok: true as const, value: undefined }
    : validateDestinationConfig(raw.primaryDestination);
  if (!destination.ok) return destination;
  if (type === "DIRECT" && !destination.value) {
    return { ok: false, message: "A Direct Link requires a primary destination." };
  }

  const deeplink = validateDeeplink(raw.deeplink);
  if (!deeplink.ok) return deeplink;
  const geo = validateGeo(raw.geo);
  if (!geo.ok) return geo;
  const shield = validateShield(raw.shield);
  if (!shield.ok) return shield;
  const tracking = validateTracking(raw.tracking);
  if (!tracking.ok) return tracking;

  return {
    ok: true,
    value: {
      title,
      slug: slug.value,
      status,
      primaryDestination: destination.value,
      deeplink: deeplink.value,
      geo: geo.value,
      shield: shield.value,
      tracking: tracking.value,
    },
  };
}

export function validateDestinationConfig(
  value: unknown,
): { ok: true; value: DestinationConfig } | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Destination is invalid." };
  }
  const raw = value as Record<string, unknown>;
  if (!isDestinationProviderId(raw.provider)) {
    return { ok: false, message: "Destination provider is unsupported." };
  }
  const provider = raw.provider.trim().toUpperCase();
  if (raw.label !== undefined && (typeof raw.label !== "string" || raw.label.length > 100)) {
    return { ok: false, message: "Destination label is invalid." };
  }
  if (raw.value !== undefined && (typeof raw.value !== "string" || raw.value.length > 500)) {
    return { ok: false, message: "Destination value is invalid." };
  }
  if (typeof raw.url !== "string" || raw.url.length > 2048) {
    return { ok: false, message: "Destination URL is invalid." };
  }

  const sourceValue = typeof raw.value === "string" && raw.value.trim()
    ? raw.value.trim()
    : raw.url.trim();
  const normalized = normalizeProviderDestination(provider, sourceValue);
  if (!normalized.ok) {
    return { ok: false, message: normalized.error };
  }

  if (
    raw.fallbackUrl !== undefined &&
    raw.fallbackUrl !== "" &&
    (typeof raw.fallbackUrl !== "string" || !isSafeHttpUrl(raw.fallbackUrl))
  ) {
    return { ok: false, message: "Fallback URL must use HTTP or HTTPS." };
  }

  let deeplinkOverrides: DestinationConfig["deeplinkOverrides"];
  if (raw.deeplinkOverrides !== undefined) {
    if (!raw.deeplinkOverrides || typeof raw.deeplinkOverrides !== "object" || Array.isArray(raw.deeplinkOverrides)) {
      return { ok: false, message: "Destination deeplink overrides are invalid." };
    }
    const overrides = raw.deeplinkOverrides as Record<string, unknown>;
    const android = optionalDeeplinkUri(overrides.android);
    const ios = optionalDeeplinkUri(overrides.ios);
    if (!android.ok || !ios.ok) {
      return { ok: false, message: "Custom deeplink URI uses an unsupported scheme." };
    }
    deeplinkOverrides = {
      ...(android.value ? { android: android.value } : {}),
      ...(ios.value ? { ios: ios.value } : {}),
    };
  }

  const definition = getDestinationProvider(normalized.value.provider);
  return {
    ok: true,
    value: {
      provider: normalized.value.provider,
      value: normalized.value.value,
      url: normalized.value.url,
      ...(typeof raw.label === "string" && raw.label.trim()
        ? { label: raw.label.trim() }
        : { label: definition.name }),
      ...(typeof raw.fallbackUrl === "string" && raw.fallbackUrl.trim()
        ? { fallbackUrl: raw.fallbackUrl.trim() }
        : {}),
      ...(deeplinkOverrides && Object.keys(deeplinkOverrides).length ? { deeplinkOverrides } : {}),
    },
  };
}

function validateStatus(value: unknown): Exclude<SmartLinkStatus, "DISABLED"> | null {
  return value === "DRAFT" || value === "PUBLISHED" ? value : null;
}

function validateDeeplink(
  value: unknown,
): { ok: true; value: DeeplinkConfig } | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Deeplink configuration is invalid." };
  }
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.enabled !== "boolean" ||
    !["SMART", "STANDARD_REDIRECT", "EXTERNAL_BROWSER_HELPER"].includes(String(raw.strategy)) ||
    typeof raw.openInBrowserHelper !== "boolean" ||
    typeof raw.longPressHelper !== "boolean"
  ) {
    return { ok: false, message: "Deeplink configuration is invalid." };
  }

  const android = validatePlatformDeeplink(raw.android, "Android");
  if (!android.ok) return android;
  const ios = validatePlatformDeeplink(raw.ios, "iOS");
  if (!ios.ok) return ios;

  return {
    ok: true,
    value: {
      enabled: raw.enabled,
      strategy: raw.strategy as DeeplinkConfig["strategy"],
      openInBrowserHelper: raw.openInBrowserHelper,
      longPressHelper: raw.longPressHelper,
      ...(android.value ? { android: android.value } : {}),
      ...(ios.value ? { ios: ios.value } : {}),
    },
  };
}

function validatePlatformDeeplink(value: unknown, label: string) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false as const, message: `${label} deeplink configuration is invalid.` };
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.enabled !== "boolean") {
    return { ok: false as const, message: `${label} deeplink configuration is invalid.` };
  }
  const uri = optionalDeeplinkUri(raw.customUri);
  if (!uri.ok) {
    return { ok: false as const, message: `${label} custom URI uses an unsupported scheme.` };
  }
  return {
    ok: true as const,
    value: { enabled: raw.enabled, ...(uri.value ? { customUri: uri.value } : {}) },
  };
}

function validateGeo(
  value: unknown,
): { ok: true; value: GeoConfig } | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Geo configuration is invalid." };
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.enabled !== "boolean" || !Array.isArray(raw.rules) || raw.rules.length > 50) {
    return { ok: false, message: "Geo configuration is invalid." };
  }

  const ids = new Set<string>();
  const claimedCountries = new Set<string>();
  const rules: GeoConfig["rules"] = [];
  for (const candidate of raw.rules) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return { ok: false, message: "Geo rule is invalid." };
    }
    const rule = candidate as Record<string, unknown>;
    if (typeof rule.id !== "string" || !rule.id || rule.id.length > 100 || ids.has(rule.id)) {
      return { ok: false, message: "Geo rule IDs must be valid and unique." };
    }
    if (!Array.isArray(rule.countries) || rule.countries.length < 1 || rule.countries.length > 100) {
      return { ok: false, message: "Each geo rule needs at least one country code." };
    }
    const countries = [...new Set(rule.countries.map((country) => typeof country === "string" ? country.trim().toUpperCase() : ""))];
    if (countries.some((country) => !/^[A-Z]{2}$/.test(country))) {
      return { ok: false, message: "Geo country codes must use two-letter ISO codes such as RS or US." };
    }
    if (countries.some((country) => claimedCountries.has(country))) {
      return { ok: false, message: "A country can appear in only one geo rule." };
    }
    const action = validateGeoAction(rule.action);
    if (!action.ok) return action;
    ids.add(rule.id);
    countries.forEach((country) => claimedCountries.add(country));
    rules.push({ id: rule.id, countries, action: action.value });
  }

  const fallback = validateGeoAction(raw.fallback);
  if (!fallback.ok) return fallback;

  return {
    ok: true,
    value: { enabled: raw.enabled, rules, fallback: fallback.value },
  };
}

function validateGeoAction(
  value: unknown,
): { ok: true; value: GeoAction } | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Geo action is invalid." };
  }
  const raw = value as Record<string, unknown>;
  if (raw.type === "DEFAULT_PAGE") return { ok: true, value: { type: "DEFAULT_PAGE" } };
  if (raw.type === "BLOCK") return { ok: true, value: { type: "BLOCK" } };
  if (raw.type === "REDIRECT") {
    const destination = validateDestinationConfig(raw.destination);
    if (!destination.ok) return destination;
    return { ok: true, value: { type: "REDIRECT", destination: destination.value } };
  }
  return { ok: false, message: "Geo action is invalid." };
}

function validateShield(
  value: unknown,
): { ok: true; value: ShieldConfig } | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Shield configuration is invalid." };
  }
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.enabled !== "boolean" ||
    !["STANDARD", "STRICT"].includes(String(raw.mode)) ||
    !["ALLOW", "BLOCK", "PREVIEW"].includes(String(raw.verifiedCrawlerPolicy))
  ) {
    return { ok: false, message: "Shield configuration is invalid." };
  }
  return {
    ok: true,
    value: {
      enabled: raw.enabled,
      mode: raw.mode as ShieldConfig["mode"],
      verifiedCrawlerPolicy: raw.verifiedCrawlerPolicy as ShieldConfig["verifiedCrawlerPolicy"],
    },
  };
}

function validateTracking(
  value: unknown,
): { ok: true; value: TrackingConfig } | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Tracking configuration is invalid." };
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.internalAnalytics !== "boolean") {
    return { ok: false, message: "Tracking configuration is invalid." };
  }

  const ga4 = optionalTrimmedString(raw.ga4MeasurementId, 40);
  if (!ga4.ok) return { ok: false, message: "GA4 Measurement ID is invalid." };
  if (ga4.value && !/^G-[A-Z0-9]{4,30}$/i.test(ga4.value)) {
    return { ok: false, message: "GA4 Measurement ID must look like G-XXXXXXXXXX." };
  }

  const meta = optionalTrimmedString(raw.metaPixelId, 30);
  if (!meta.ok || (meta.value && !/^\d{5,30}$/.test(meta.value))) {
    return { ok: false, message: "Meta Pixel ID must contain digits only." };
  }

  return {
    ok: true,
    value: {
      internalAnalytics: raw.internalAnalytics,
      ...(ga4.value ? { ga4MeasurementId: ga4.value.toUpperCase() } : {}),
      ...(meta.value ? { metaPixelId: meta.value } : {}),
    },
  };
}

function optionalTrimmedString(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === "") {
    return { ok: true as const, value: undefined };
  }
  if (typeof value !== "string" || value.length > maxLength) {
    return { ok: false as const, value: undefined };
  }
  return { ok: true as const, value: value.trim() || undefined };
}

function optionalDeeplinkUri(value: unknown) {
  const text = optionalTrimmedString(value, 2048);
  if (!text.ok || !text.value) return text;
  const separator = text.value.indexOf(":");
  if (separator <= 0) return { ok: false as const, value: undefined };
  const scheme = text.value.slice(0, separator).toLowerCase();
  if (!/^[a-z][a-z0-9+.-]*$/.test(scheme)) {
    return { ok: false as const, value: undefined };
  }
  if (["javascript", "data", "file", "vbscript"].includes(scheme)) {
    return { ok: false as const, value: undefined };
  }
  return { ok: true as const, value: text.value };
}

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
