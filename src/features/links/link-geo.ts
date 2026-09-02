import type {
  GeoDestination,
  LinkGeoConfig,
  LinkGeoRule,
  PublicProfileLink,
} from "@/types/profile";
import type { DestinationConfig } from "@/types/smart-link";

export const LINK_GEO_COUNTRIES = [
  { code: "RS", name: "Serbia" },
  { code: "DE", name: "Germany" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "HR", name: "Croatia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "ME", name: "Montenegro" },
  { code: "MK", name: "North Macedonia" },
  { code: "SI", name: "Slovenia" },
  { code: "AL", name: "Albania" },
  { code: "BG", name: "Bulgaria" },
  { code: "RO", name: "Romania" },
  { code: "HU", name: "Hungary" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "SK", name: "Slovakia" },
  { code: "GR", name: "Greece" },
  { code: "TR", name: "Türkiye" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
] as const;

export const DEFAULT_LINK_GEO_CONFIG: LinkGeoConfig = {
  enabled: false,
  fallback: "SHOW",
  rules: [],
};

export type LinkGeoResolution = {
  visible: boolean;
  url: string;
  action: "SHOW" | "HIDE" | "REDIRECT";
  destination?: DestinationConfig;
  matchedRuleId?: string;
};

export function resolveLinkGeo(
  link: Pick<PublicProfileLink, "url" | "geo" | "geoDestinations">,
  countryCode: string | null | undefined,
): LinkGeoResolution {
  const normalizedCountry = normalizeCountryCode(countryCode);
  const geo = effectiveLinkGeo(link.geo, link.geoDestinations);

  if (!geo.enabled) {
    return link.geo
      ? { visible: true, url: link.url, action: "SHOW" }
      : legacyResolution(link.url, link.geoDestinations, normalizedCountry);
  }

  const rule = normalizedCountry
    ? geo.rules.find(
        (candidate) => normalizeCountryCode(candidate.countryCode) === normalizedCountry,
      )
    : undefined;

  if (!rule) {
    return geo.fallback === "HIDE"
      ? { visible: false, url: link.url, action: "HIDE" }
      : { visible: true, url: link.url, action: "SHOW" };
  }

  if (rule.action === "HIDE") {
    return {
      visible: false,
      url: link.url,
      action: "HIDE",
      matchedRuleId: rule.id,
    };
  }

  if (rule.action === "REDIRECT") {
    return {
      visible: true,
      url: rule.destination?.url || link.url,
      action: "REDIRECT",
      destination: rule.destination ? { ...rule.destination } : undefined,
      matchedRuleId: rule.id,
    };
  }

  return {
    visible: true,
    url: link.url,
    action: "SHOW",
    matchedRuleId: rule.id,
  };
}

export function effectiveLinkGeo(
  geo: LinkGeoConfig | undefined,
  legacyDestinations: GeoDestination[] = [],
): LinkGeoConfig {
  if (geo) {
    return {
      enabled: geo.enabled,
      fallback: geo.fallback ?? "SHOW",
      rules: geo.rules.map(cloneGeoRule),
    };
  }

  if (!legacyDestinations.length) {
    return structuredClone(DEFAULT_LINK_GEO_CONFIG);
  }

  return {
    enabled: true,
    fallback: "SHOW",
    rules: legacyDestinations.map((destination) => ({
      id: destination.id,
      countryCode: destination.countryCode.toUpperCase(),
      countryName: destination.countryName,
      action: "REDIRECT" as const,
      destination: {
        provider: "CUSTOM",
        value: destination.url,
        url: destination.url,
      },
    })),
  };
}

export function linkGeoToLegacyDestinations(
  geo: LinkGeoConfig | undefined,
  fallback: GeoDestination[] = [],
): GeoDestination[] {
  if (!geo) return fallback.map((destination) => ({ ...destination }));
  if (!geo.enabled) return [];

  return geo.rules.flatMap((rule) => {
    if (rule.action !== "REDIRECT" || !rule.destination?.url) return [];
    return [
      {
        id: rule.id,
        countryCode: rule.countryCode.toUpperCase(),
        countryName: rule.countryName,
        url: rule.destination.url,
      },
    ];
  });
}

export function createLinkGeoRule(existingRules: LinkGeoRule[]): LinkGeoRule | null {
  const country = LINK_GEO_COUNTRIES.find(
    (candidate) =>
      !existingRules.some(
        (rule) => normalizeCountryCode(rule.countryCode) === candidate.code,
      ),
  );
  if (!country) return null;

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `geo-${Date.now()}`,
    countryCode: country.code,
    countryName: country.name,
    action: "SHOW",
  };
}

export function normalizeCountryCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(normalized) && normalized !== "XX" ? normalized : null;
}

function legacyResolution(
  defaultUrl: string,
  destinations: GeoDestination[],
  countryCode: string | null,
): LinkGeoResolution {
  if (!countryCode) return { visible: true, url: defaultUrl, action: "SHOW" };
  const destination = destinations.find(
    (candidate) => normalizeCountryCode(candidate.countryCode) === countryCode,
  );
  return destination
    ? { visible: true, url: destination.url, action: "REDIRECT", matchedRuleId: destination.id }
    : { visible: true, url: defaultUrl, action: "SHOW" };
}

function cloneGeoRule(rule: LinkGeoRule): LinkGeoRule {
  return {
    ...rule,
    destination: rule.destination
      ? {
          ...rule.destination,
          deeplinkOverrides: rule.destination.deeplinkOverrides
            ? { ...rule.destination.deeplinkOverrides }
            : undefined,
        }
      : undefined,
  };
}
