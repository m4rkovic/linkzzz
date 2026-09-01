import type { PersistedProfileData } from "@/types/persisted-profile";

type RequestHeaders = Pick<Headers, "get">;

const COUNTRY_HEADERS = ["x-vercel-ip-country", "cf-ipcountry"] as const;
const ISO_COUNTRY_CODE = /^[A-Z]{2}$/;
const UNKNOWN_COUNTRY_CODES = new Set(["XX"]);

export function getVisitorCountryCode(headers: RequestHeaders) {
  for (const header of COUNTRY_HEADERS) {
    const countryCode = normalizeCountryCode(headers.get(header));
    if (countryCode) return countryCode;
  }

  return null;
}

export function resolvePublicProfileGeoRouting(
  profile: PersistedProfileData,
  countryCode: string | null | undefined,
): PersistedProfileData {
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  return {
    ...profile,
    links: profile.links.map((link) => {
      const destination = normalizedCountryCode
        ? link.geoDestinations.find(
            (candidate) =>
              normalizeCountryCode(candidate.countryCode) ===
              normalizedCountryCode,
          )
        : undefined;

      return {
        ...link,
        url: destination?.url ?? link.url,
        // Country-specific alternatives are server-side routing configuration,
        // not public data required by the rendered page.
        geoDestinations: [],
      };
    }),
  };
}

function normalizeCountryCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  if (
    !ISO_COUNTRY_CODE.test(normalized) ||
    UNKNOWN_COUNTRY_CODES.has(normalized)
  ) {
    return null;
  }
  return normalized;
}
