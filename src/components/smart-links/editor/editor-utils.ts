import type {
  DestinationConfig,
  GeoAction,
  SmartLinkEditableData,
} from "@/types/smart-link";

import type { SerializableSmartLink } from "./types";

export function editable(smartLink: SerializableSmartLink): SmartLinkEditableData {
  return {
    title: smartLink.title,
    slug: smartLink.slug,
    status: smartLink.status,
    primaryDestination: smartLink.primaryDestination
      ? structuredClone(smartLink.primaryDestination)
      : undefined,
    deeplink: structuredClone(smartLink.deeplink),
    geo: structuredClone(smartLink.geo),
    shield: structuredClone(smartLink.shield),
    tracking: structuredClone(smartLink.tracking),
  };
}

export function emptyDestination(): DestinationConfig {
  return { provider: "CUSTOM", url: "", fallbackUrl: "" };
}

export function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
}

export function parseCountryCodes(value: string) {
  return [...new Set(
    value
      .split(/[\s,;]+/)
      .map((country) => country.trim().toUpperCase())
      .filter(Boolean),
  )];
}

export function actionFromType(type: string, current: GeoAction): GeoAction {
  if (type === "BLOCK") return { type: "BLOCK" };
  if (type === "DEFAULT_PAGE") return { type: "DEFAULT_PAGE" };
  if (current.type === "REDIRECT") return current;
  return { type: "REDIRECT", destination: emptyDestination() };
}

