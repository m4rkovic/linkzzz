import type { DestinationProviderId } from "@/features/destinations/provider-registry";

export type SmartLinkType = "LANDING_PAGE" | "DIRECT";
export type SmartLinkStatus = "DRAFT" | "PUBLISHED" | "DISABLED";

export type DestinationConfig = {
  provider: DestinationProviderId;
  label?: string;
  value?: string;
  url: string;
  fallbackUrl?: string;
  deeplinkOverrides?: {
    android?: string;
    ios?: string;
  };
};

export type PlatformDeeplinkConfig = {
  enabled: boolean;
  customUri?: string;
};

export type DeeplinkConfig = {
  enabled: boolean;
  strategy: "SMART" | "STANDARD_REDIRECT" | "EXTERNAL_BROWSER_HELPER";
  openInBrowserHelper: boolean;
  longPressHelper: boolean;
  android?: PlatformDeeplinkConfig;
  ios?: PlatformDeeplinkConfig;
};

export type GeoAction =
  | { type: "DEFAULT_PAGE" }
  | { type: "BLOCK" }
  | { type: "REDIRECT"; destination: DestinationConfig };

export type GeoRule = {
  id: string;
  countries: string[];
  regions?: string[];
  cities?: string[];
  action: GeoAction;
};

export type GeoConfig = {
  enabled: boolean;
  rules: GeoRule[];
  fallback: GeoAction;
};

export type ShieldConfig = {
  enabled: boolean;
  mode: "STANDARD" | "STRICT";
  verifiedCrawlerPolicy: "ALLOW" | "BLOCK" | "PREVIEW";
};

export type TrackingConfig = {
  internalAnalytics: boolean;
  ga4MeasurementId?: string;
  metaPixelId?: string;
};

export const DEFAULT_DEEPLINK_CONFIG: DeeplinkConfig = {
  enabled: true,
  strategy: "SMART",
  openInBrowserHelper: false,
  longPressHelper: false,
  android: { enabled: true },
  ios: { enabled: true },
};

export const DEFAULT_GEO_CONFIG: GeoConfig = {
  enabled: false,
  rules: [],
  fallback: { type: "DEFAULT_PAGE" },
};

export const DEFAULT_SHIELD_CONFIG: ShieldConfig = {
  enabled: false,
  mode: "STANDARD",
  verifiedCrawlerPolicy: "ALLOW",
};

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  internalAnalytics: true,
};

export type SmartLinkRecord = {
  id: string;
  userId: string;
  type: SmartLinkType;
  title: string;
  slug: string;
  status: SmartLinkStatus;
  primaryDestination?: DestinationConfig;
  deeplink: DeeplinkConfig;
  geo: GeoConfig;
  shield: ShieldConfig;
  tracking: TrackingConfig;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SmartLinkEditableData = Pick<
  SmartLinkRecord,
  | "title"
  | "slug"
  | "status"
  | "primaryDestination"
  | "deeplink"
  | "geo"
  | "shield"
  | "tracking"
>;
