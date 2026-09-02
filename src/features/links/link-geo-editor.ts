import {
  normalizeProviderDestination,
  providerInputFromUrl,
} from "@/features/destinations/provider-registry";
import { normalizeCountryCode } from "@/features/links/link-geo";
import type { LinkGeoConfig } from "@/types/profile";
import type { DestinationConfig } from "@/types/smart-link";

export function normalizeLinkGeoConfig(geo: LinkGeoConfig): LinkGeoConfig {
  return {
    enabled: geo.enabled,
    fallback: geo.fallback ?? "SHOW",
    rules: geo.rules.map((rule) => ({
      ...rule,
      countryCode: rule.countryCode.trim().toUpperCase(),
      countryName: rule.countryName.trim(),
      destination:
        rule.action === "REDIRECT" && rule.destination
          ? normalizeDestination(rule.destination)
          : undefined,
    })),
  };
}

export function validateLinkGeoConfig(geo: LinkGeoConfig): string {
  if (!geo.enabled) return "";
  if (geo.rules.length > 50) return "A card can contain at most 50 Geo rules.";

  const countries = new Set<string>();
  for (const rule of geo.rules) {
    const countryCode = normalizeCountryCode(rule.countryCode);
    if (!countryCode) return "Every Geo rule needs a valid two-letter country code.";
    if (!rule.countryName.trim()) return "Every Geo rule needs a country name.";
    if (countries.has(countryCode)) return "Each country can appear only once in a card's Geo rules.";
    countries.add(countryCode);

    if (rule.action === "REDIRECT") {
      if (!rule.destination) return "Geo redirect rules need a destination.";
      const input = rule.destination.value || providerInputFromUrl(rule.destination.provider, rule.destination.url);
      const normalized = normalizeProviderDestination(rule.destination.provider, input);
      if (!normalized.ok) return normalized.error;
    }
  }

  return "";
}

function normalizeDestination(destination: DestinationConfig): DestinationConfig {
  const input = destination.value || providerInputFromUrl(destination.provider, destination.url);
  const normalized = normalizeProviderDestination(destination.provider, input);
  if (!normalized.ok) {
    return {
      ...destination,
      value: input.trim(),
      url: destination.url.trim(),
    };
  }

  return {
    ...destination,
    provider: normalized.value.provider,
    value: normalized.value.value,
    url: normalized.value.url,
  };
}
