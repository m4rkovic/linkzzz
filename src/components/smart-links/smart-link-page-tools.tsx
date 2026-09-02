"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";

import ProfilePreviewFrame from "@/components/ui/profile-preview-frame";
import { useProfile } from "@/features/profile/profile-context";
import type { VisitorLocation } from "@/types/profile";

const previewVisitor: VisitorLocation = {
  countryCode: "RS",
  countryName: "Serbia",
  flag: "🇷🇸",
};

export function PageDirtyObserver({ onChange }: { onChange: (dirty: boolean) => void }) {
  const { dirty } = useProfile();

  useEffect(() => {
    onChange(dirty);
  }, [dirty, onChange]);

  useEffect(() => () => onChange(false), [onChange]);

  return null;
}

export function SmartLinkPagePreview({
  open,
  onClose,
  slug,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
}) {
  const { profile } = useProfile();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-zinc-950/65 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-6">
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close preview"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="smart-link-preview-title"
        className="relative mx-auto w-full max-w-[460px] rounded-3xl bg-white p-4 shadow-2xl sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p id="smart-link-preview-title" className="text-sm font-black text-zinc-950">Landing Page preview</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">linkzzz.com/{slug}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/${slug}`}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
            >
              Open <ExternalLink size={14} />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              aria-label="Close preview"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <ProfilePreviewFrame
          profile={profile}
          visitor={previewVisitor}
          title="Live preview"
          subtitle="Unsaved Page changes are included"
          badge={profile.status === "PUBLISHED" ? "Live" : "Draft"}
        />
      </div>
    </div>,
    document.body,
  );
}
