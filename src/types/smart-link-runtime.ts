export type VisitorPlatform = "IOS" | "ANDROID" | "DESKTOP";

export type VisitorBrowser =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "MESSENGER"
  | "TIKTOK"
  | "X"
  | "TELEGRAM"
  | "REDDIT"
  | "LINKEDIN"
  | "DISCORD"
  | "SAFARI"
  | "CHROME"
  | "EDGE"
  | "FIREFOX"
  | "OTHER";

export type TrafficKind = "HUMAN" | "VERIFIED_CRAWLER" | "KNOWN_CRAWLER" | "AUTOMATION";

export type SmartLinkRequestContext = {
  userAgent: string;
  platform: VisitorPlatform;
  browser: VisitorBrowser;
  isMobile: boolean;
  isInAppBrowser: boolean;
  countryCode: string | null;
  traffic: TrafficKind;
};
