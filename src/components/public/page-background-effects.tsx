import type { CSSProperties } from "react";

import { addAlpha } from "@/components/public/profile-renderer-utils";
import type { PublicProfileData } from "@/types/profile";

export default function PageBackgroundEffects({ profile }: { profile: PublicProfileData }) {
  const appearance = profile.appearance;
  const effect = appearance.backgroundEffect ?? "none";
  const color = appearance.backgroundEffectColor ?? appearance.primaryTextColor;
  const intensity = Math.max(0, Math.min(1, appearance.backgroundEffectIntensity ?? 0.2));

  if (effect === "none" || intensity <= 0) return null;

  if (effect === "mesh") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-[18%] -top-[12%] h-[52vw] min-h-72 w-[52vw] min-w-72 rounded-full blur-3xl"
          style={{ backgroundColor: addAlpha(color, 0.22 * intensity) }}
        />
        <div
          className="absolute -right-[20%] top-[18%] h-[46vw] min-h-64 w-[46vw] min-w-64 rounded-full blur-3xl"
          style={{ backgroundColor: addAlpha(shiftHex(color, 24), 0.16 * intensity) }}
        />
        <div
          className="absolute bottom-[-20%] left-[18%] h-[42vw] min-h-60 w-[42vw] min-w-60 rounded-full blur-3xl"
          style={{ backgroundColor: addAlpha(shiftHex(color, -20), 0.12 * intensity) }}
        />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-[-22%] h-[58vw] min-h-80 w-[58vw] min-w-80 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: addAlpha(color, 0.2 * intensity) } as CSSProperties}
      />
    </div>
  );
}

function shiftHex(value: string, amount: number) {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  if (!match) return value;
  const raw = match[1];
  const channels = [0, 2, 4].map((index) => Math.max(0, Math.min(255, parseInt(raw.slice(index, index + 2), 16) + amount)));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
