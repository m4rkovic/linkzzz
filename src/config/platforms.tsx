import type { ElementType } from "react";
import { Link2 } from "lucide-react";
import { FaDiscord, FaFacebookF, FaGithub, FaInstagram, FaLinkedinIn, FaSoundcloud, FaSpotify, FaTelegramPlane, FaTwitch, FaYoutube } from "react-icons/fa";
import { FaThreads, FaTiktok, FaXTwitter } from "react-icons/fa6";
import type { PlatformId } from "@/types/profile";

export type PlatformOption = { id: PlatformId; name: string; icon: ElementType };

export const PLATFORMS: PlatformOption[] = [
  { id: "custom", name: "Custom link", icon: Link2 },
  { id: "website", name: "Website", icon: Link2 },
  { id: "instagram", name: "Instagram", icon: FaInstagram },
  { id: "tiktok", name: "TikTok", icon: FaTiktok },
  { id: "youtube", name: "YouTube", icon: FaYoutube },
  { id: "spotify", name: "Spotify", icon: FaSpotify },
  { id: "facebook", name: "Facebook", icon: FaFacebookF },
  { id: "x", name: "X", icon: FaXTwitter },
  { id: "threads", name: "Threads", icon: FaThreads },
  { id: "twitch", name: "Twitch", icon: FaTwitch },
  { id: "discord", name: "Discord", icon: FaDiscord },
  { id: "telegram", name: "Telegram", icon: FaTelegramPlane },
  { id: "linkedin", name: "LinkedIn", icon: FaLinkedinIn },
  { id: "github", name: "GitHub", icon: FaGithub },
  { id: "soundcloud", name: "SoundCloud", icon: FaSoundcloud },
];


export type PlatformIconProps = {
  platform: PlatformId;
  size?: number;
  className?: string;
};

/**
 * Stable React component for rendering a platform icon.
 *
 * Do not resolve an icon component inside another component render with
 * `const Icon = getPlatformIcon(...)`; React Compiler lint treats that as
 * creating a component during render. This switch keeps every component
 * reference static at module scope.
 */
export function PlatformIcon({ platform, size, className }: PlatformIconProps) {
  const props = { size, className };

  switch (platform) {
    case "instagram":
      return <FaInstagram {...props} />;
    case "tiktok":
      return <FaTiktok {...props} />;
    case "youtube":
      return <FaYoutube {...props} />;
    case "spotify":
      return <FaSpotify {...props} />;
    case "facebook":
      return <FaFacebookF {...props} />;
    case "x":
      return <FaXTwitter {...props} />;
    case "threads":
      return <FaThreads {...props} />;
    case "twitch":
      return <FaTwitch {...props} />;
    case "discord":
      return <FaDiscord {...props} />;
    case "telegram":
      return <FaTelegramPlane {...props} />;
    case "linkedin":
      return <FaLinkedinIn {...props} />;
    case "github":
      return <FaGithub {...props} />;
    case "soundcloud":
      return <FaSoundcloud {...props} />;
    case "website":
    case "custom":
    default:
      return <Link2 {...props} />;
  }
}

export function getPlatformIcon(platform: PlatformId) {
  return PLATFORMS.find((item) => item.id === platform)?.icon ?? Link2;
}

export function getPlatformName(platform: PlatformId) {
  return PLATFORMS.find((item) => item.id === platform)?.name ?? "Custom link";
}

export function detectPlatform(url: string): PlatformId {
  const value = url.toLowerCase();
  if (value.includes("instagram.com")) return "instagram";
  if (value.includes("tiktok.com")) return "tiktok";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "youtube";
  if (value.includes("spotify.com")) return "spotify";
  if (value.includes("facebook.com")) return "facebook";
  if (value.includes("threads.net")) return "threads";
  if (value.includes("twitch.tv")) return "twitch";
  if (value.includes("discord.gg") || value.includes("discord.com")) return "discord";
  if (value.includes("telegram.me") || value.includes("t.me/")) return "telegram";
  if (value.includes("linkedin.com")) return "linkedin";
  if (value.includes("github.com")) return "github";
  if (value.includes("soundcloud.com")) return "soundcloud";
  if (value.includes("x.com") || value.includes("twitter.com")) return "x";
  return "custom";
}
