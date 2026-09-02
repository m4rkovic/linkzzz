export type DestinationProviderId =
  | "CUSTOM"
  | "WEBSITE"
  | "STORE"
  | "INSTAGRAM"
  | "TIKTOK"
  | "YOUTUBE"
  | "YOUTUBE_MUSIC"
  | "X"
  | "FACEBOOK"
  | "THREADS"
  | "SNAPCHAT"
  | "TELEGRAM"
  | "WHATSAPP"
  | "REDDIT"
  | "PINTEREST"
  | "TWITCH"
  | "LINKEDIN"
  | "DISCORD"
  | "SPOTIFY"
  | "APPLE_MUSIC"
  | "SOUNDCLOUD"
  | "BANDCAMP"
  | "PATREON"
  | "KO_FI"
  | "BUY_ME_A_COFFEE"
  | "GITHUB"
  | "EMAIL"
  | "PHONE";

export type DestinationProviderCategory =
  | "Popular"
  | "Social"
  | "Music"
  | "Contact"
  | "Creator"
  | "Commerce"
  | "Custom";

export type DestinationInputType = "USERNAME" | "URL" | "PHONE" | "EMAIL" | "INVITE";

export type DestinationProviderDefinition = {
  id: DestinationProviderId;
  name: string;
  category: DestinationProviderCategory;
  inputType: DestinationInputType;
  inputLabel: string;
  placeholder: string;
  description: string;
  supportsDeeplink: boolean;
  popular?: boolean;
};

const DEFINITIONS: DestinationProviderDefinition[] = [
  { id: "INSTAGRAM", name: "Instagram", category: "Social", inputType: "USERNAME", inputLabel: "Username or profile URL", placeholder: "@creatorname", description: "Instagram profile", supportsDeeplink: true, popular: true },
  { id: "TIKTOK", name: "TikTok", category: "Social", inputType: "USERNAME", inputLabel: "Username or profile URL", placeholder: "@creatorname", description: "TikTok profile", supportsDeeplink: true, popular: true },
  { id: "YOUTUBE", name: "YouTube", category: "Social", inputType: "USERNAME", inputLabel: "Handle or channel URL", placeholder: "@creatorname", description: "YouTube channel, video or playlist", supportsDeeplink: true, popular: true },
  { id: "SPOTIFY", name: "Spotify", category: "Music", inputType: "URL", inputLabel: "Spotify URL", placeholder: "https://open.spotify.com/artist/...", description: "Track, artist, album or playlist", supportsDeeplink: true, popular: true },
  { id: "APPLE_MUSIC", name: "Apple Music", category: "Music", inputType: "URL", inputLabel: "Apple Music URL", placeholder: "https://music.apple.com/...", description: "Artist, album or song", supportsDeeplink: true, popular: true },
  { id: "TELEGRAM", name: "Telegram", category: "Social", inputType: "USERNAME", inputLabel: "Username or t.me URL", placeholder: "creatorname", description: "Telegram user, group or channel", supportsDeeplink: true, popular: true },
  { id: "WHATSAPP", name: "WhatsApp", category: "Contact", inputType: "PHONE", inputLabel: "Phone number or wa.me URL", placeholder: "+381601234567", description: "Open a WhatsApp conversation", supportsDeeplink: true, popular: true },
  { id: "WEBSITE", name: "Website", category: "Custom", inputType: "URL", inputLabel: "Website URL", placeholder: "example.com", description: "Normal website destination", supportsDeeplink: false, popular: true },
  { id: "CUSTOM", name: "Custom link", category: "Custom", inputType: "URL", inputLabel: "Destination URL", placeholder: "https://...", description: "Any supported custom web destination", supportsDeeplink: false, popular: true },
  { id: "X", name: "X / Twitter", category: "Social", inputType: "USERNAME", inputLabel: "Username or profile URL", placeholder: "@creatorname", description: "X profile", supportsDeeplink: true },
  { id: "FACEBOOK", name: "Facebook", category: "Social", inputType: "USERNAME", inputLabel: "Page name or Facebook URL", placeholder: "creatorname", description: "Facebook page or profile", supportsDeeplink: true },
  { id: "THREADS", name: "Threads", category: "Social", inputType: "USERNAME", inputLabel: "Username or Threads URL", placeholder: "@creatorname", description: "Threads profile", supportsDeeplink: true },
  { id: "SNAPCHAT", name: "Snapchat", category: "Social", inputType: "USERNAME", inputLabel: "Username or profile URL", placeholder: "creatorname", description: "Snapchat profile", supportsDeeplink: true },
  { id: "REDDIT", name: "Reddit", category: "Social", inputType: "USERNAME", inputLabel: "Username or Reddit URL", placeholder: "creatorname", description: "Reddit profile or destination", supportsDeeplink: true },
  { id: "PINTEREST", name: "Pinterest", category: "Social", inputType: "USERNAME", inputLabel: "Username or Pinterest URL", placeholder: "creatorname", description: "Pinterest profile", supportsDeeplink: true },
  { id: "TWITCH", name: "Twitch", category: "Social", inputType: "USERNAME", inputLabel: "Channel name or Twitch URL", placeholder: "creatorname", description: "Twitch channel", supportsDeeplink: true },
  { id: "LINKEDIN", name: "LinkedIn", category: "Social", inputType: "USERNAME", inputLabel: "Profile slug or LinkedIn URL", placeholder: "in/aleksa-markovic", description: "LinkedIn profile or company", supportsDeeplink: true },
  { id: "DISCORD", name: "Discord", category: "Social", inputType: "INVITE", inputLabel: "Invite code or URL", placeholder: "discord.gg/abc123", description: "Discord invite", supportsDeeplink: true },
  { id: "YOUTUBE_MUSIC", name: "YouTube Music", category: "Music", inputType: "URL", inputLabel: "YouTube Music URL", placeholder: "https://music.youtube.com/...", description: "YouTube Music destination", supportsDeeplink: true },
  { id: "SOUNDCLOUD", name: "SoundCloud", category: "Music", inputType: "USERNAME", inputLabel: "Profile name or SoundCloud URL", placeholder: "creatorname", description: "SoundCloud profile or track", supportsDeeplink: true },
  { id: "BANDCAMP", name: "Bandcamp", category: "Music", inputType: "URL", inputLabel: "Bandcamp URL", placeholder: "https://artist.bandcamp.com/...", description: "Bandcamp artist, album or track", supportsDeeplink: true },
  { id: "PATREON", name: "Patreon", category: "Creator", inputType: "USERNAME", inputLabel: "Creator name or Patreon URL", placeholder: "creatorname", description: "Patreon creator page", supportsDeeplink: true },
  { id: "KO_FI", name: "Ko-fi", category: "Creator", inputType: "USERNAME", inputLabel: "Creator name or Ko-fi URL", placeholder: "creatorname", description: "Ko-fi creator page", supportsDeeplink: true },
  { id: "BUY_ME_A_COFFEE", name: "Buy Me a Coffee", category: "Creator", inputType: "USERNAME", inputLabel: "Creator name or URL", placeholder: "creatorname", description: "Buy Me a Coffee creator page", supportsDeeplink: true },
  { id: "STORE", name: "Store", category: "Commerce", inputType: "URL", inputLabel: "Store URL", placeholder: "https://store.example.com", description: "Online store or product page", supportsDeeplink: false },
  { id: "GITHUB", name: "GitHub", category: "Social", inputType: "USERNAME", inputLabel: "Username or GitHub URL", placeholder: "creatorname", description: "GitHub profile or repository", supportsDeeplink: true },
  { id: "EMAIL", name: "Email", category: "Contact", inputType: "EMAIL", inputLabel: "Email address", placeholder: "hello@example.com", description: "Open the visitor's email app", supportsDeeplink: true },
  { id: "PHONE", name: "Phone", category: "Contact", inputType: "PHONE", inputLabel: "Phone number", placeholder: "+381601234567", description: "Open the visitor's phone app", supportsDeeplink: true },
];

export const DESTINATION_PROVIDERS = Object.freeze(DEFINITIONS);
export const DESTINATION_PROVIDER_CATEGORIES: DestinationProviderCategory[] = [
  "Popular",
  "Social",
  "Music",
  "Contact",
  "Creator",
  "Commerce",
  "Custom",
];

const PROVIDER_IDS = new Set<DestinationProviderId>(DEFINITIONS.map((item) => item.id));

export function isDestinationProviderId(value: unknown): value is DestinationProviderId {
  return typeof value === "string" && PROVIDER_IDS.has(value.trim().toUpperCase() as DestinationProviderId);
}

export function getDestinationProvider(id: string): DestinationProviderDefinition {
  const normalized = id.trim().toUpperCase() as DestinationProviderId;
  return DEFINITIONS.find((item) => item.id === normalized) ?? DEFINITIONS.find((item) => item.id === "CUSTOM")!;
}

export function listDestinationProviders(category?: DestinationProviderCategory) {
  if (!category) return DESTINATION_PROVIDERS;
  if (category === "Popular") return DESTINATION_PROVIDERS.filter((item) => item.popular);
  return DESTINATION_PROVIDERS.filter((item) => item.category === category);
}

export type NormalizedDestination = {
  provider: DestinationProviderId;
  value: string;
  url: string;
};

export type DestinationNormalizationResult =
  | { ok: true; value: NormalizedDestination }
  | { ok: false; error: string };

export function normalizeProviderDestination(
  providerValue: string,
  inputValue: string,
): DestinationNormalizationResult {
  if (!isDestinationProviderId(providerValue)) {
    return { ok: false, error: "Unsupported destination provider." };
  }

  const provider = providerValue.trim().toUpperCase() as DestinationProviderId;
  const input = inputValue.trim();
  if (!input) return { ok: false, error: `${getDestinationProvider(provider).name} destination is required.` };

  try {
    switch (provider) {
      case "CUSTOM":
      case "WEBSITE":
      case "STORE":
        return webDestination(provider, input);
      case "INSTAGRAM":
        return usernameDestination(provider, input, ["instagram.com", "www.instagram.com"], (username) => `https://www.instagram.com/${username}`);
      case "TIKTOK":
        return usernameDestination(provider, input, ["tiktok.com", "www.tiktok.com"], (username) => `https://www.tiktok.com/@${stripAt(username)}`);
      case "YOUTUBE":
        return youtubeDestination(input);
      case "YOUTUBE_MUSIC":
        return hostUrlDestination(provider, input, ["music.youtube.com"]);
      case "X":
        return usernameDestination(provider, input, ["x.com", "www.x.com", "twitter.com", "www.twitter.com"], (username) => `https://x.com/${stripAt(username)}`);
      case "FACEBOOK":
        return usernameDestination(provider, input, ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"], (username) => `https://www.facebook.com/${stripAt(username)}`);
      case "THREADS":
        return usernameDestination(provider, input, ["threads.net", "www.threads.net"], (username) => `https://www.threads.net/@${stripAt(username)}`);
      case "SNAPCHAT":
        return usernameDestination(provider, input, ["snapchat.com", "www.snapchat.com"], (username) => `https://www.snapchat.com/add/${stripAt(username)}`);
      case "TELEGRAM":
        return usernameDestination(provider, input, ["t.me", "telegram.me", "www.telegram.me"], (username) => `https://t.me/${stripAt(username)}`);
      case "WHATSAPP":
        return whatsappDestination(input);
      case "REDDIT":
        return usernameDestination(provider, input, ["reddit.com", "www.reddit.com", "old.reddit.com"], (username) => `https://www.reddit.com/user/${stripAt(username)}`);
      case "PINTEREST":
        return usernameDestination(provider, input, ["pinterest.com", "www.pinterest.com"], (username) => `https://www.pinterest.com/${stripAt(username)}`);
      case "TWITCH":
        return usernameDestination(provider, input, ["twitch.tv", "www.twitch.tv"], (username) => `https://www.twitch.tv/${stripAt(username)}`);
      case "LINKEDIN":
        return linkedinDestination(input);
      case "DISCORD":
        return discordDestination(input);
      case "SPOTIFY":
        return hostUrlDestination(provider, input, ["open.spotify.com"]);
      case "APPLE_MUSIC":
        return hostUrlDestination(provider, input, ["music.apple.com"]);
      case "SOUNDCLOUD":
        return usernameDestination(provider, input, ["soundcloud.com", "www.soundcloud.com"], (username) => `https://soundcloud.com/${stripAt(username)}`);
      case "BANDCAMP":
        return bandcampDestination(input);
      case "PATREON":
        return usernameDestination(provider, input, ["patreon.com", "www.patreon.com"], (username) => `https://www.patreon.com/${stripAt(username)}`);
      case "KO_FI":
        return usernameDestination(provider, input, ["ko-fi.com", "www.ko-fi.com"], (username) => `https://ko-fi.com/${stripAt(username)}`);
      case "BUY_ME_A_COFFEE":
        return usernameDestination(provider, input, ["buymeacoffee.com", "www.buymeacoffee.com"], (username) => `https://www.buymeacoffee.com/${stripAt(username)}`);
      case "GITHUB":
        return usernameDestination(provider, input, ["github.com", "www.github.com"], (username) => `https://github.com/${stripAt(username)}`);
      case "EMAIL":
        return emailDestination(input);
      case "PHONE":
        return phoneDestination(input);
    }
  } catch {
    return { ok: false, error: `Enter a valid ${getDestinationProvider(provider).name} destination.` };
  }
}

export function providerInputFromUrl(providerValue: string, url: string) {
  if (!url) return "";
  if (!isDestinationProviderId(providerValue)) return url;
  const provider = providerValue.trim().toUpperCase() as DestinationProviderId;
  if (provider === "EMAIL") return url.replace(/^mailto:/i, "");
  if (provider === "PHONE") return url.replace(/^tel:/i, "");
  if (provider === "WHATSAPP") {
    try {
      const parsed = new URL(ensureHttps(url));
      if (parsed.hostname === "wa.me") return `+${parsed.pathname.replace(/\D/g, "")}`;
    } catch { /* use original */ }
  }
  return url;
}

export function destinationProviderToPlatformId(provider: DestinationProviderId) {
  return provider.toLowerCase().replaceAll("_", "-");
}

export function destinationProviderFromPlatformId(platform: string | null | undefined): DestinationProviderId {
  const candidate = platform?.trim().toUpperCase().replaceAll("-", "_") ?? "";
  return isDestinationProviderId(candidate) ? candidate : "CUSTOM";
}

function webDestination(provider: DestinationProviderId, input: string): DestinationNormalizationResult {
  const parsed = safeWebUrl(input);
  if (!parsed) return { ok: false, error: "Enter a valid HTTP or HTTPS URL." };
  return ok(provider, input, parsed.toString());
}

function usernameDestination(
  provider: DestinationProviderId,
  input: string,
  allowedHosts: string[],
  builder: (username: string) => string,
): DestinationNormalizationResult {
  if (looksLikeUrl(input)) {
    const parsed = safeWebUrl(input);
    if (!parsed || !allowedHosts.includes(parsed.hostname.toLowerCase())) {
      return { ok: false, error: `Enter a valid ${getDestinationProvider(provider).name} URL or username.` };
    }
    return ok(provider, input, canonicalWebUrl(parsed));
  }
  const username = stripAt(input).replace(/^\/+|\/+$/g, "");
  if (!username || /\s/.test(username) || username.length > 160) {
    return { ok: false, error: `Enter a valid ${getDestinationProvider(provider).name} username.` };
  }
  return ok(provider, input, builder(username));
}

function youtubeDestination(input: string): DestinationNormalizationResult {
  if (looksLikeUrl(input)) {
    const parsed = safeWebUrl(input);
    if (!parsed || !["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"].includes(parsed.hostname.toLowerCase())) {
      return { ok: false, error: "Enter a valid YouTube URL or handle." };
    }
    return ok("YOUTUBE", input, canonicalWebUrl(parsed));
  }
  const handle = stripAt(input);
  if (!handle || /\s/.test(handle)) return { ok: false, error: "Enter a valid YouTube handle." };
  return ok("YOUTUBE", input, `https://www.youtube.com/@${handle}`);
}

function whatsappDestination(input: string): DestinationNormalizationResult {
  if (looksLikeUrl(input)) {
    const parsed = safeWebUrl(input);
    if (!parsed || !["wa.me", "api.whatsapp.com", "www.whatsapp.com"].includes(parsed.hostname.toLowerCase())) {
      return { ok: false, error: "Enter a WhatsApp phone number or wa.me URL." };
    }
    return ok("WHATSAPP", input, canonicalWebUrl(parsed));
  }
  const digits = input.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return { ok: false, error: "Enter a valid international phone number." };
  return ok("WHATSAPP", input, `https://wa.me/${digits}`);
}

function linkedinDestination(input: string): DestinationNormalizationResult {
  if (looksLikeUrl(input)) return hostUrlDestination("LINKEDIN", input, ["linkedin.com", "www.linkedin.com"]);
  const slug = input.replace(/^\/+|\/+$/g, "").replace(/^@/, "");
  if (!slug || /\s/.test(slug)) return { ok: false, error: "Enter a valid LinkedIn profile slug or URL." };
  const path = slug.startsWith("in/") || slug.startsWith("company/") ? slug : `in/${slug}`;
  return ok("LINKEDIN", input, `https://www.linkedin.com/${path}`);
}

function discordDestination(input: string): DestinationNormalizationResult {
  if (looksLikeUrl(input)) {
    const parsed = safeWebUrl(input);
    if (!parsed || !["discord.gg", "discord.com", "www.discord.com"].includes(parsed.hostname.toLowerCase())) {
      return { ok: false, error: "Enter a valid Discord invite URL or code." };
    }
    return ok("DISCORD", input, canonicalWebUrl(parsed));
  }
  const code = input.replace(/^\/+|\/+$/g, "");
  if (!code || /\s/.test(code)) return { ok: false, error: "Enter a valid Discord invite code." };
  return ok("DISCORD", input, `https://discord.gg/${code}`);
}

function bandcampDestination(input: string): DestinationNormalizationResult {
  const parsed = safeWebUrl(input);
  if (!parsed || !(parsed.hostname === "bandcamp.com" || parsed.hostname.endsWith(".bandcamp.com"))) {
    return { ok: false, error: "Enter a valid Bandcamp URL." };
  }
  return ok("BANDCAMP", input, canonicalWebUrl(parsed));
}

function hostUrlDestination(provider: DestinationProviderId, input: string, hosts: string[]): DestinationNormalizationResult {
  const parsed = safeWebUrl(input);
  if (!parsed || !hosts.includes(parsed.hostname.toLowerCase())) {
    return { ok: false, error: `Enter a valid ${getDestinationProvider(provider).name} URL.` };
  }
  return ok(provider, input, canonicalWebUrl(parsed));
}

function emailDestination(input: string): DestinationNormalizationResult {
  const email = input.replace(/^mailto:/i, "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "Enter a valid email address." };
  }
  return ok("EMAIL", email, `mailto:${email}`);
}

function phoneDestination(input: string): DestinationNormalizationResult {
  const raw = input.replace(/^tel:/i, "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return { ok: false, error: "Enter a valid phone number." };
  const normalized = raw.startsWith("+") ? `+${digits}` : digits;
  return ok("PHONE", normalized, `tel:${normalized}`);
}

function ok(provider: DestinationProviderId, value: string, url: string): DestinationNormalizationResult {
  return { ok: true, value: { provider, value: value.trim(), url } };
}

function stripAt(value: string) {
  return value.trim().replace(/^@+/, "");
}

function looksLikeUrl(value: string) {
  return /^https?:\/\//i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(value);
}

function ensureHttps(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function safeWebUrl(value: string) {
  try {
    const parsed = new URL(ensureHttps(value.trim()));
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (!parsed.hostname || parsed.username || parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

function canonicalWebUrl(parsed: URL) {
  parsed.protocol = "https:";
  parsed.hash = "";
  return parsed.toString();
}
