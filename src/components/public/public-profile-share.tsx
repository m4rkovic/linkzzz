"use client";

import { useState, type CSSProperties } from "react";
import { Share2 } from "lucide-react";

export default function PublicProfileShareButton({
  title,
  text,
  className,
  style,
  iconSize = 17,
}: {
  title: string;
  text: string;
  className: string;
  style: CSSProperties;
  iconSize?: number;
}) {
  const [copied, setCopied] = useState(false);

  async function shareProfile() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy profile link:", url);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={shareProfile}
        className={className}
        style={style}
        aria-label="Share profile"
      >
        <Share2 size={iconSize} />
      </button>
      {copied ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-xl ring-1 ring-white/10"
        >
          Profile link copied
        </div>
      ) : null}
    </>
  );
}
