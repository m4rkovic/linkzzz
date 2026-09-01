import type { LinkCardLayout } from "@/types/profile";

export const MAX_LINKS = 100;

export const LINK_LAYOUT_OPTIONS: { id: LinkCardLayout; name: string; description: string }[] = [
  { id: "button", name: "Button", description: "Classic Linkzzz link" },
  { id: "compact", name: "Compact", description: "Small visual tile" },
  { id: "half", name: "Half", description: "Two-column tile" },
  { id: "full", name: "Full", description: "Full-width visual card" },
  { id: "featured", name: "Featured", description: "Large hero-style card" },
];
