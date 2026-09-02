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

export function ProviderIcon({ provider, size = 18, className }: { provider: DestinationProviderId; size?: number; className?: string }) {
  const props = { size, className };
  switch (provider) {
    case "INSTAGRAM": return <FaInstagram {...props} />;
    case "TIKTOK": return <FaTiktok {...props} />;
    case "YOUTUBE":
    case "YOUTUBE_MUSIC": return <FaYoutube {...props} />;
    case "X": return <FaXTwitter {...props} />;
    case "FACEBOOK": return <FaFacebookF {...props} />;
    case "THREADS": return <FaThreads {...props} />;
    case "SNAPCHAT": return <FaSnapchatGhost {...props} />;
    case "TELEGRAM": return <FaTelegramPlane {...props} />;
    case "WHATSAPP": return <FaWhatsapp {...props} />;
    case "REDDIT": return <FaRedditAlien {...props} />;
    case "PINTEREST": return <FaPinterestP {...props} />;
    case "TWITCH": return <FaTwitch {...props} />;
    case "LINKEDIN": return <FaLinkedinIn {...props} />;
    case "DISCORD": return <FaDiscord {...props} />;
    case "SPOTIFY": return <FaSpotify {...props} />;
    case "APPLE_MUSIC": return <Apple {...props} />;
    case "SOUNDCLOUD": return <FaSoundcloud {...props} />;
    case "BANDCAMP": return <FaBandcamp {...props} />;
    case "PATREON": return <FaPatreon {...props} />;
    case "KO_FI":
    case "BUY_ME_A_COFFEE": return <Coffee {...props} />;
    case "GITHUB": return <FaGithub {...props} />;
    case "EMAIL": return <Mail {...props} />;
    case "PHONE": return <Phone {...props} />;
    case "STORE": return <ShoppingBag {...props} />;
    case "WEBSITE": return <Link2 {...props} />;
    case "CUSTOM": return <Link2 {...props} />;
    default: return <Link2 {...props} />;
  }
}
