import type { GeoAction, GeoConfig } from "@/types/smart-link";

export function resolveSmartLinkGeoAction(
  geo: GeoConfig,
  countryCode: string | null | undefined,
): GeoAction | null {
  if (!geo.enabled) return null;
  const normalized = normalizeCountryCode(countryCode);
  if (normalized) {
    const match = geo.rules.find((rule) =>
      rule.countries.some((country) => normalizeCountryCode(country) === normalized),
    );
    if (match) return match.action;
  }
  return geo.fallback;
}

function normalizeCountryCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(normalized) && normalized !== "XX" ? normalized : null;
}
