"use client";

import type { CSSProperties } from "react";
import { ExternalLink } from "lucide-react";

import { PlatformIcon } from "@/config/platforms";
import {
  addAlpha,
  getButtonStyle,
  resolveLinkUrl,
} from "@/components/public/profile-renderer-utils";
import type {
  PublicProfileData,
  PublicProfileLink,
  VisitorLocation,
} from "@/types/profile";

export default function PublicClassicLinkButton({
  profile,
  link,
  visitor,
  isPreview,
  onClick,
  focused = false,
  dimmed = false,
  disabled = false,
}: {
  profile: PublicProfileData;
  link: PublicProfileLink;
  visitor?: VisitorLocation;
  isPreview: boolean;
  onClick: () => void;
  focused?: boolean;
  dimmed?: boolean;
  disabled?: boolean;
}) {
  const appearance = profile.appearance;
  const resolvedUrl = resolveLinkUrl(link, visitor);
  const focusEffect = link.customStyle?.focusEffect ?? "none";
  const focusClass = focused
    ? focusEffect === "glow-shake"
      ? "linkzzz-focus-glow linkzzz-focus-shake"
      : focusEffect === "glow"
        ? "linkzzz-focus-glow"
        : focusEffect === "shake"
          ? "linkzzz-focus-shake"
          : ""
    : "";

  return (
    <a
      href={isPreview || disabled ? undefined : resolvedUrl}
      target={isPreview || disabled ? undefined : "_blank"}
      rel={isPreview || disabled ? undefined : "noopener noreferrer"}
      onClick={(event) => {
        if (isPreview || disabled) {
          event.preventDefault();
          return;
        }
        if (!link.sensitiveContent?.enabled) onClick();
      }}
      aria-disabled={disabled || undefined}
      className={`group flex w-full items-center gap-4 border text-left backdrop-blur-xl transition duration-200 ${focusClass} ${
        dimmed ? "linkzzz-focus-dim" : ""
      } ${disabled ? "cursor-not-allowed opacity-60" : ""} ${
        isPreview
          ? "min-h-16 px-3.5 py-3"
          : disabled
            ? "min-h-[72px] px-4 py-3.5 sm:px-5"
            : "min-h-[72px] px-4 py-3.5 hover:-translate-y-0.5 active:scale-[0.99] sm:px-5"
      }`}
      style={
        {
          ...getButtonStyle(appearance),
          "--linkzzz-focus-color":
            link.customStyle?.focusColor ?? appearance.buttonTextColor,
          "--linkzzz-focus-delay": `${Math.max(
            0,
            link.customStyle?.focusDelayMs ?? 0,
          )}ms`,
        } as CSSProperties
      }
    >
      {(link.showPlatformIcon ?? true) ? (
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl ${
            isPreview ? "h-9 w-9" : "h-11 w-11"
          }`}
          style={{
            backgroundColor: addAlpha(appearance.buttonTextColor, 0.09),
            color: appearance.buttonTextColor,
          }}
        >
          <PlatformIcon
            platform={link.platform ?? "custom"}
            size={isPreview ? 16 : 19}
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        {(link.showTitle ?? true) ? (
          <p
            className={`truncate font-semibold ${
              isPreview ? "text-xs" : "text-sm sm:text-[15px]"
            }`}
          >
            {link.title}
          </p>
        ) : null}
        {(link.showDescription ?? true) && link.description ? (
          <p className="mt-0.5 truncate text-xs opacity-60">{link.description}</p>
        ) : null}
      </div>

      {!isPreview ? (
        disabled ? (
          <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.08em] opacity-60">
            Expired
          </span>
        ) : (
          <ExternalLink
            size={16}
            className="shrink-0 opacity-40 transition group-hover:opacity-100"
          />
        )
      ) : null}
    </a>
  );
}
