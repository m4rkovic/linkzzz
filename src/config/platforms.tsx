import type { ElementType } from "react";
import { Apple, Coffee, Link2, Mail, Phone, ShoppingBag } from "lucide-react";
import {
  FaBandcamp,
  FaDiscord,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaPatreon,
  FaPinterestP,
  FaRedditAlien,
  FaSnapchatGhost,
  FaSoundcloud,
  FaSpotify,
  FaTelegramPlane,
  FaTwitch,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { FaThreads, FaTiktok, FaXTwitter } from "react-icons/fa6";
import type { DestinationProviderId } from "@/features/destinations/provider-registry";
import { DESTINATION_PROVIDERS } from "@/features/destinations/provider-registry";
import type { PlatformId } from "@/types/profile";

export type PlatformOption = { id: PlatformId; name: string; icon: ElementType };

export const PLATFORMS: PlatformOption[] = DESTINATION_PROVIDERS.map((provider) => ({
  id: providerToPlatformId(provider.id),
  name: provider.name,
  icon: getPlatformIcon(providerToPlatformId(provider.id)),
}));

export function providerToPlatformId(provider: DestinationProviderId): PlatformId {
  return provider.toLowerCase().replaceAll("_", "-") as PlatformId;
}

export function platformToProviderId(platform: PlatformId): DestinationProviderId {
  return platform.toUpperCase().replaceAll("-", "_") as DestinationProviderId;
}

export type PlatformIconProps = {
  platform: PlatformId;
  size?: number;
  className?: string;
};

export function PlatformIcon({ platform, size, className }: PlatformIconProps) {
  const props = { size, className };
  switch (platform) {
    case "instagram": return <FaInstagram {...props} />;
    case "tiktok": return <FaTiktok {...props} />;
    case "youtube":
    case "youtube-music": return <FaYoutube {...props} />;
    case "spotify": return <FaSpotify {...props} />;
    case "apple-music": return <Apple {...props} />;
    case "facebook": return <FaFacebookF {...props} />;
    case "x": return <FaXTwitter {...props} />;
    case "threads": return <FaThreads {...props} />;
    case "snapchat": return <FaSnapchatGhost {...props} />;
    case "twitch": return <FaTwitch {...props} />;
    case "discord": return <FaDiscord {...props} />;
    case "telegram": return <FaTelegramPlane {...props} />;
    case "whatsapp": return <FaWhatsapp {...props} />;
    case "reddit": return <FaRedditAlien {...props} />;
    case "pinterest": return <FaPinterestP {...props} />;
    case "linkedin": return <FaLinkedinIn {...props} />;
    case "github": return <FaGithub {...props} />;
    case "soundcloud": return <FaSoundcloud {...props} />;
    case "bandcamp": return <FaBandcamp {...props} />;
    case "patreon": return <FaPatreon {...props} />;
    case "ko-fi":
    case "buy-me-a-coffee": return <Coffee {...props} />;
    case "email": return <Mail {...props} />;
    case "phone": return <Phone {...props} />;
    case "store": return <ShoppingBag {...props} />;
    case "website":
    case "custom":
    default: return <Link2 {...props} />;
  }
}

export function getPlatformIcon(platform: PlatformId): ElementType {
  switch (platform) {
    case "instagram": return FaInstagram;
    case "tiktok": return FaTiktok;
    case "youtube":
    case "youtube-music": return FaYoutube;
    case "spotify": return FaSpotify;
    case "apple-music": return Apple;
    case "facebook": return FaFacebookF;
    case "x": return FaXTwitter;
    case "threads": return FaThreads;
    case "snapchat": return FaSnapchatGhost;
    case "twitch": return FaTwitch;
    case "discord": return FaDiscord;
    case "telegram": return FaTelegramPlane;
    case "whatsapp": return FaWhatsapp;
    case "reddit": return FaRedditAlien;
    case "pinterest": return FaPinterestP;
    case "linkedin": return FaLinkedinIn;
    case "github": return FaGithub;
    case "soundcloud": return FaSoundcloud;
    case "bandcamp": return FaBandcamp;
    case "patreon": return FaPatreon;
    case "ko-fi":
    case "buy-me-a-coffee": return Coffee;
    case "email": return Mail;
    case "phone": return Phone;
    case "store": return ShoppingBag;
    case "website":
    case "custom":
    default: return Link2;
  }
}

export function getPlatformName(platform: PlatformId) {
  return PLATFORMS.find((item) => item.id === platform)?.name ?? "Custom link";
}

export function detectPlatform(url: string): PlatformId {
  const value = url.toLowerCase();
  if (value.startsWith("mailto:")) return "email";
  if (value.startsWith("tel:")) return "phone";
  if (value.includes("instagram.com")) return "instagram";
  if (value.includes("tiktok.com")) return "tiktok";
  if (value.includes("music.youtube.com")) return "youtube-music";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "youtube";
  if (value.includes("open.spotify.com")) return "spotify";
  if (value.includes("music.apple.com")) return "apple-music";
  if (value.includes("facebook.com")) return "facebook";
  if (value.includes("threads.net")) return "threads";
  if (value.includes("snapchat.com")) return "snapchat";
  if (value.includes("twitch.tv")) return "twitch";
  if (value.includes("discord.gg") || value.includes("discord.com")) return "discord";
  if (value.includes("telegram.me") || value.includes("t.me/")) return "telegram";
  if (value.includes("wa.me") || value.includes("whatsapp.com")) return "whatsapp";
  if (value.includes("reddit.com")) return "reddit";
  if (value.includes("pinterest.com")) return "pinterest";
  if (value.includes("linkedin.com")) return "linkedin";
  if (value.includes("github.com")) return "github";
  if (value.includes("soundcloud.com")) return "soundcloud";
  if (value.includes("bandcamp.com")) return "bandcamp";
  if (value.includes("patreon.com")) return "patreon";
  if (value.includes("ko-fi.com")) return "ko-fi";
  if (value.includes("buymeacoffee.com")) return "buy-me-a-coffee";
  if (value.includes("x.com") || value.includes("twitter.com")) return "x";
  return "custom";
}
