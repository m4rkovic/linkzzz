import { resolveLinkGeo } from "@/features/links/link-geo";
import type { PersistedProfileData } from "@/types/persisted-profile";

type RequestHeaders = Pick<Headers, "get">;

const ISO_COUNTRY_CODE = /^[A-Z]{2}$/;
const UNKNOWN_COUNTRY_CODES = new Set(["XX"]);
const HTTP_HEADER_NAME = /^[!#$%&'*+\-.^_`|~0-9a-z]+$/i;

export function getVisitorCountryCode(headers: RequestHeaders) {
  if (process.env.LINKZZZ_TRUST_PROXY_HEADERS !== "1") return null;

  const headerName = normalizeHeaderName(process.env.LINKZZZ_GEO_HEADER);
  if (!headerName) return null;
  return normalizeCountryCode(headers.get(headerName));
}

export function resolvePublicProfileGeoRouting(
  profile: PersistedProfileData,
  countryCode: string | null | undefined,
): PersistedProfileData {
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  return {
    ...profile,
    links: profile.links.flatMap((link) => {
      const resolution = resolveLinkGeo(link, normalizedCountryCode);
      if (!resolution.visible) return [];

      return [
        {
          ...link,
          url: resolution.url,
          // Country rules are runtime configuration. Do not send the complete
          // routing table to visitors after the server has resolved it.
          geo: undefined,
          geoDestinations: [],
        },
      ];
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

function normalizeHeaderName(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized && HTTP_HEADER_NAME.test(normalized) ? normalized : null;
}
