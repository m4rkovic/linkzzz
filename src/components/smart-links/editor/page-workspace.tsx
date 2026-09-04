"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";

import AppearanceEditor from "@/components/appearance/appearance-editor";
import LinksEditor from "@/components/links/links-editor";
import PageBlocksEditor from "@/components/profile/page-blocks-editor";
import ProfileEditor from "@/components/profile/profile-editor";
import ProfilePreviewFrame from "@/components/ui/profile-preview-frame";
import { useProfile } from "@/features/profile/profile-context";
import type { PublicProfileData, VisitorLocation } from "@/types/profile";

import type { PageSection } from "./types";

const previewVisitor: VisitorLocation = {
  countryCode: "RS",
  countryName: "Serbia",
  flag: "🇷🇸",
};

export function PageWorkspace({
  pageSection,
  setPageSection,
  onPreview,
}: {
  pageSection: PageSection;
  setPageSection: (value: PageSection) => void;
  onPreview: () => void;
}) {
  const { profile } = useProfile();
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");
  const [cardPreviewProfile, setCardPreviewProfile] = useState<PublicProfileData>(profile);
  const previewProfile = pageSection === "Cards" ? cardPreviewProfile : profile;

  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="px-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Landing Page</p>

          <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 2xl:hidden" aria-label="Editor view">
            <button
              type="button"
              onClick={() => setMobileMode("edit")}
              aria-pressed={mobileMode === "edit"}
              aria-label="Show editor"
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-black transition ${mobileMode === "edit" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              type="button"
              onClick={() => setMobileMode("preview")}
              aria-pressed={mobileMode === "preview"}
              aria-label="Show inline preview"
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-black transition ${mobileMode === "preview" ? "bg-brand-violet-strong text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              <Eye size={13} /> Preview
            </button>
          </div>

          <button
            type="button"
            onClick={onPreview}
            className="hidden min-h-9 shrink-0 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 2xl:inline-flex"
          >
            <Eye size={14} /> Preview
          </button>
        </div>

        <nav
          className={`${mobileMode === "preview" ? "hidden 2xl:grid" : "grid"} mt-3 min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(132px,auto)] sm:items-end`}
          aria-label="Landing Page sections"
        >
          <div className="min-w-0">
            <span className="block pl-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Content</span>
            <div className="mt-1.5 grid min-w-0 grid-cols-3 gap-1.5">
              {(["Profile", "Cards", "Blocks"] as const).map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setPageSection(section)}
                  aria-current={pageSection === section ? "page" : undefined}
                  className={`min-h-10 min-w-0 rounded-xl px-2 py-2 text-xs font-bold leading-4 sm:px-3 sm:text-sm ${
                    pageSection === section
                      ? "bg-brand-violet-strong text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {section === "Profile" ? "Profile & Socials" : section}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <span className="block pl-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Design</span>
            <button
              type="button"
              onClick={() => setPageSection("Appearance")}
              aria-current={pageSection === "Appearance" ? "page" : undefined}
              className={`mt-1.5 min-h-10 w-full min-w-0 rounded-xl px-3 text-xs font-bold sm:text-sm ${
                pageSection === "Appearance"
                  ? "bg-brand-violet-strong text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Appearance
            </button>
          </div>
        </nav>
      </div>

      <div className={`${mobileMode === "preview" ? "block 2xl:hidden" : "hidden"} mt-4`}>
        <div className="mx-auto max-w-[430px] rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4">
          <ProfilePreviewFrame
            profile={previewProfile}
            visitor={previewVisitor}
            title="Page preview"
            subtitle="Unsaved Page changes are included"
            badge={profile.status === "PUBLISHED" ? "Live" : "Draft"}
          />
        </div>
      </div>

      <div className={mobileMode === "preview" ? "hidden 2xl:block" : "block"}>
        <div className="mt-4 grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:items-start 2xl:gap-8">
          <div className="min-w-0">
            <div className={pageSection === "Profile" ? "block" : "hidden"}>
              <ProfileEditor smartLinkScoped showPreview={false} />
            </div>
            <div className={pageSection === "Appearance" ? "block" : "hidden"}>
              <AppearanceEditor showPreview={false} />
            </div>
            <div className={pageSection === "Cards" ? "block" : "hidden"}>
              <LinksEditor showPreview={false} onPreviewProfileChange={setCardPreviewProfile} />
            </div>
            <div className={pageSection === "Blocks" ? "block" : "hidden"}>
              <PageBlocksEditor />
            </div>
          </div>

          <div className="hidden min-w-0 2xl:block">
            <ProfilePreviewFrame
              profile={previewProfile}
              visitor={previewVisitor}
              title="Live page preview"
              subtitle="Follows you while Page settings change"
              badge={profile.status === "PUBLISHED" ? "Live" : "Draft"}
              stickyFrom="2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
