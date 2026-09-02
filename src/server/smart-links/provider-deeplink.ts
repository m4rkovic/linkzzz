import type { DestinationProviderId } from "@/features/destinations/provider-registry";
import type { DestinationConfig } from "@/types/smart-link";
import type { VisitorPlatform } from "@/types/smart-link-runtime";

const UNSAFE_SCHEMES = new Set(["javascript", "data", "file", "vbscript"]);

export function getDestinationAppUri(
  destination: DestinationConfig,
  platform: Exclude<VisitorPlatform, "DESKTOP">,
): string | null {
  const explicit = platform === "ANDROID"
    ? destination.deeplinkOverrides?.android
    : destination.deeplinkOverrides?.ios;
  if (explicit) return safeAppUri(explicit);

  return buildProviderAppUri(destination.provider, destination.url, platform);
}

export function buildProviderAppUri(
  provider: DestinationProviderId,
  url: string,
  platform: Exclude<VisitorPlatform, "DESKTOP">,
): string | null {
  switch (provider) {
    case "INSTAGRAM":
      return instagramUri(url);
    case "YOUTUBE":
      return youtubeUri(url, platform);
    case "SPOTIFY":
      return spotifyUri(url);
    case "TELEGRAM":
      return telegramUri(url);
    case "WHATSAPP":
      return whatsappUri(url);
    case "X":
      return xUri(url);
    case "SNAPCHAT":
      return snapchatUri(url);
    case "EMAIL":
    case "PHONE":
      return safeAppUri(url);
    default:
      // Many providers already use universal/app links reliably and do not
      // expose a stable public custom scheme for every destination shape.
      // Returning null intentionally prefers the canonical HTTPS URL instead
      // of guessing a brittle app URI.
      return null;
  }
}

export function safeAppUri(value: string | null | undefined) {
  const uri = value?.trim();
  if (!uri || uri.length > 2048) return null;
  const separator = uri.indexOf(":");
  if (separator <= 0) return null;
  const scheme = uri.slice(0, separator).toLowerCase();
  if (!/^[a-z][a-z0-9+.-]*$/.test(scheme) || UNSAFE_SCHEMES.has(scheme)) {
    return null;
  }
  return uri;
}

function instagramUri(url: string) {
  const parsed = safeHttpUrl(url);
  if (!parsed || !/^(?:www\.)?instagram\.com$/i.test(parsed.hostname)) return null;
  const segments = pathSegments(parsed);
  if (segments.length !== 1) return null;
  const username = segments[0];
  if (!username || ["p", "reel", "reels", "stories", "explore"].includes(username.toLowerCase())) {
    return null;
  }
  return `instagram://user?username=${encodeURIComponent(username)}`;
}

function youtubeUri(url: string, platform: Exclude<VisitorPlatform, "DESKTOP">) {
  const parsed = safeHttpUrl(url);
  if (!parsed || !["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(parsed.hostname.toLowerCase())) {
    return null;
  }

  const videoId = parsed.hostname.toLowerCase() === "youtu.be"
    ? pathSegments(parsed)[0]
    : parsed.searchParams.get("v") ?? undefined;

  if (platform === "ANDROID") {
    const canonical = videoId
      ? `www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
      : `${parsed.hostname}${parsed.pathname}${parsed.search}`.replace(/^https?:\/\//i, "");
    const fallback = encodeURIComponent(parsed.toString());
    return `intent://${canonical}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${fallback};end`;
  }

  if (videoId) return `youtube://watch?v=${encodeURIComponent(videoId)}`;
  return null;
}

function spotifyUri(url: string) {
  const parsed = safeHttpUrl(url);
  if (!parsed || parsed.hostname.toLowerCase() !== "open.spotify.com") return null;
  let segments = pathSegments(parsed);
  if (segments[0]?.toLowerCase().startsWith("intl-")) segments = segments.slice(1);
  const [kind, id] = segments;
  if (!kind || !id || !["track", "artist", "album", "playlist", "show", "episode"].includes(kind)) {
    return null;
  }
  return `spotify:${kind}:${id}`;
}

function telegramUri(url: string) {
  const parsed = safeHttpUrl(url);
  if (!parsed || !["t.me", "telegram.me", "www.telegram.me"].includes(parsed.hostname.toLowerCase())) {
    return null;
  }
  const first = pathSegments(parsed)[0];
  if (!first) return null;
  if (first.startsWith("+")) {
    return `tg://join?invite=${encodeURIComponent(first.slice(1))}`;
  }
  return `tg://resolve?domain=${encodeURIComponent(first)}`;
}

function whatsappUri(url: string) {
  const parsed = safeHttpUrl(url);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  if (host === "wa.me") {
    const phone = pathSegments(parsed)[0]?.replace(/\D/g, "");
    if (!phone) return null;
    const text = parsed.searchParams.get("text");
    return `whatsapp://send?phone=${encodeURIComponent(phone)}${text ? `&text=${encodeURIComponent(text)}` : ""}`;
  }
  if (host === "api.whatsapp.com") {
    const phone = parsed.searchParams.get("phone")?.replace(/\D/g, "");
    if (!phone) return null;
    const text = parsed.searchParams.get("text");
    return `whatsapp://send?phone=${encodeURIComponent(phone)}${text ? `&text=${encodeURIComponent(text)}` : ""}`;
  }
  return null;
}

function xUri(url: string) {
  const parsed = safeHttpUrl(url);
  if (!parsed || !["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(parsed.hostname.toLowerCase())) {
    return null;
  }
  const username = pathSegments(parsed)[0];
  if (!username || ["home", "explore", "search", "i"].includes(username.toLowerCase())) return null;
  return `twitter://user?screen_name=${encodeURIComponent(username)}`;
}

function snapchatUri(url: string) {
  const parsed = safeHttpUrl(url);
  if (!parsed || !["snapchat.com", "www.snapchat.com"].includes(parsed.hostname.toLowerCase())) return null;
  const segments = pathSegments(parsed);
  const username = segments[0]?.toLowerCase() === "add" ? segments[1] : undefined;
  return username ? `snapchat://add/${encodeURIComponent(username)}` : null;
}

function safeHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed : null;
  } catch {
    return null;
  }
}

function pathSegments(url: URL) {
  return url.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}
