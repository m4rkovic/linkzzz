import type { GeoAction, GeoConfig } from "@/types/smart-link";

export type SmartLinkGeoResolution =
  | { type: "DISABLED" }
  | { type: "UNKNOWN_LOCATION" }
  | { type: "ACTION"; action: GeoAction; matchedRuleId?: string };

export function resolveSmartLinkGeo(
  geo: GeoConfig,
  countryCode: string | null | undefined,
): SmartLinkGeoResolution {
  if (!geo.enabled) return { type: "DISABLED" };

  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return { type: "UNKNOWN_LOCATION" };

  const match = geo.rules.find((rule) =>
    rule.countries.some((country) => normalizeCountryCode(country) === normalized),
  );

  return match
    ? { type: "ACTION", action: match.action, matchedRuleId: match.id }
    : { type: "ACTION", action: geo.fallback };
}

/** Compatibility helper for callers that only need a concrete action. */
export function resolveSmartLinkGeoAction(
  geo: GeoConfig,
  countryCode: string | null | undefined,
): GeoAction | null {
  const resolution = resolveSmartLinkGeo(geo, countryCode);
  return resolution.type === "ACTION" ? resolution.action : null;
}

function normalizeCountryCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(normalized) && normalized !== "XX" ? normalized : null;
}
