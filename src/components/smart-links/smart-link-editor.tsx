"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  Route,
  Save,
  Send,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import {
  PageDirtyObserver,
  SmartLinkPagePreview,
} from "@/components/smart-links/smart-link-page-tools";
import { Button, buttonClassName } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ProfileProvider } from "@/features/profile/profile-context";
import type { SmartLinkEditableData, SmartLinkStatus } from "@/types/smart-link";

import { DeeplinkSection } from "./editor/deeplink-section";
import { EditorNavigation } from "./editor/editor-navigation";
import { StatusBadge } from "./editor/editor-primitives";
import { editable } from "./editor/editor-utils";
import { GeoSection } from "./editor/geo-section";
import { LinkSection } from "./editor/link-section";
import { PageWorkspace } from "./editor/page-workspace";
import { ShieldSection } from "./editor/shield-section";
import { TrackingSection } from "./editor/tracking-section";
import type {
  EditorSection,
  InitialPage,
  PageSection,
  SectionDefinition,
  SerializableSmartLink,
} from "./editor/types";

export default function SmartLinkEditor({
  initialSmartLink,
  initialPage,
  initialSection = "Link",
  initialPageSection = "Profile",
}: {
  initialSmartLink: SerializableSmartLink;
  initialPage?: InitialPage;
  initialSection?: EditorSection;
  initialPageSection?: PageSection;
}) {
  const [activeSection, setActiveSection] = useState<EditorSection>(initialSection);
  const [pageSection, setPageSection] = useState<PageSection>(initialPageSection);
  const [draft, setDraft] = useState<SmartLinkEditableData>(() => editable(initialSmartLink));
  const [revision, setRevision] = useState(initialSmartLink.revision);
  const [savedSmartLink, setSavedSmartLink] = useState(initialSmartLink);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pageDirty, setPageDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const { pushToast } = useToast();
  const hasUnsavedChanges = dirty || pageDirty;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  const sections = useMemo<SectionDefinition[]>(
    () => [
      { id: "Link", label: "Smart Link", icon: Route, group: "Essential" },
      ...(initialSmartLink.type === "LANDING_PAGE"
        ? [{ id: "Page" as const, label: "Page", icon: FileText, group: "Essential" as const }]
        : []),
      { id: "Deeplink", label: "Deeplink", icon: Smartphone, group: "Advanced" },
      { id: "Geo", label: "Geo", icon: Globe2, group: "Advanced" },
      { id: "Shield", label: "Shield", icon: ShieldCheck, group: "Advanced" },
      { id: "Tracking", label: "Tracking", icon: BarChart3, group: "Advanced" },
    ],
    [initialSmartLink.type],
  );

  function change(patch: Partial<SmartLinkEditableData>) {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
    setSaved(false);
    setError("");
  }

  async function saveSmartLink(statusOverride?: SmartLinkStatus) {
    setSaving(true);
    setSaved(false);
    setError("");
    const nextDraft = statusOverride ? { ...draft, status: statusOverride } : draft;

    try {
      const response = await fetch(`/api/smart-links/${initialSmartLink.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smartLink: nextDraft, revision }),
      });
      const payload = await response.json().catch(() => null) as {
        smartLink?: SerializableSmartLink;
        error?: string;
      } | null;
      if (!response.ok || !payload?.smartLink) {
        const message = payload?.error ?? "Could not save Smart Link.";
        setError(message);
        pushToast({ title: "Save failed", description: message, tone: "error" });
        return;
      }

      setSavedSmartLink(payload.smartLink);
      setDraft(editable(payload.smartLink));
      setRevision(payload.smartLink.revision);
      setDirty(false);
      setSaved(true);
      pushToast({
        title: statusOverride === "PUBLISHED" ? "Smart Link published" : statusOverride === "DRAFT" ? "Smart Link moved to draft" : "Smart Link saved",
        tone: "success",
      });
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      const message = "Could not connect to the Linkzzz server.";
      setError(message);
      pushToast({ title: "Save failed", description: message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const publishBlocked = pageDirty;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px]">
      <Link
        href="/dashboard/links"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-zinc-600 hover:text-zinc-950"
      >
        <ArrowLeft size={17} /> Back to Smart Links
      </Link>

      <div className="mt-3 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
              {draft.title || "Untitled Smart Link"}
            </h1>
            <StatusBadge status={draft.status} />
            {hasUnsavedChanges && (
              <span className="rounded-full bg-brand-violet-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-brand-violet-strong">
                Unsaved
              </span>
            )}
          </div>
          <p className="mt-2 break-all text-sm text-zinc-500">linkzzz.com/{draft.slug}</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
          {initialSmartLink.type === "LANDING_PAGE" && (
            <Button
              onClick={() => setPreviewOpen(true)}
              className="flex-1 lg:flex-none"
            >
              <Eye size={16} /> Preview
            </Button>
          )}
          <Link
            href={`/${savedSmartLink.slug}`}
            target="_blank"
            className={buttonClassName({ className: "flex-1 lg:flex-none" })}
          >
            Open public URL <ExternalLink size={16} />
          </Link>
          <Button
            disabled={!dirty || saving}
            onClick={() => void saveSmartLink()}
            className={`${activeSection === "Page" ? "inline-flex" : "hidden lg:inline-flex"} flex-1 text-zinc-900 lg:flex-none`}
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
          <Button
            variant={draft.status === "PUBLISHED" ? "secondary" : "primary"}
            disabled={saving || publishBlocked}
            title={publishBlocked ? "Save Page changes before changing publish state." : undefined}
            onClick={() => void saveSmartLink(draft.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}
            className={`${activeSection === "Page" ? "inline-flex" : "hidden lg:inline-flex"} flex-1 font-black lg:flex-none`}
          >
            <Send size={16} />
            {draft.status === "PUBLISHED" ? "Move to draft" : "Publish"}
          </Button>
        </div>
      </div>

      {pageDirty && (
        <p className="mt-3 text-xs font-semibold text-amber-700">
          Page content has unsaved changes. Save them inside the Page section before publishing.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 min-w-0 xl:grid xl:grid-cols-[210px_minmax(0,1fr)] xl:gap-6">
        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-2">
            <p className="px-3 pb-2 pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Editor</p>
            <EditorNavigation sections={sections} activeSection={activeSection} onSelect={setActiveSection} vertical />
            <div className="mx-2 mt-2 border-t border-zinc-100 px-1 py-3">
              <p className="text-xs font-semibold text-zinc-500">{hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}</p>
              <p className="mt-1 text-[11px] leading-4 text-zinc-400">Revision {revision}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="xl:hidden">
            <EditorNavigation sections={sections} activeSection={activeSection} onSelect={setActiveSection} />
          </div>

          <div className={activeSection === "Link" ? "mt-4 xl:mt-0" : "hidden"}>
            <LinkSection smartLinkId={initialSmartLink.id} type={initialSmartLink.type} draft={draft} change={change} />
          </div>

          {initialSmartLink.type === "LANDING_PAGE" && initialPage && (
            <div className={activeSection === "Page" ? "mt-4 xl:mt-0" : "hidden"}>
              <ProfileProvider
                initialProfile={initialPage.profile}
                initialRevision={initialPage.revision}
                saveEndpoint={`/api/smart-links/${initialSmartLink.id}/page`}
                assetSmartLinkId={initialSmartLink.id}
              >
                <PageDirtyObserver onChange={setPageDirty} />
                <PageWorkspace
                  pageSection={pageSection}
                  setPageSection={setPageSection}
                  onPreview={() => setPreviewOpen(true)}
                />
                <SmartLinkPagePreview
                  open={previewOpen}
                  onClose={() => setPreviewOpen(false)}
                  slug={draft.slug}
                />
              </ProfileProvider>
            </div>
          )}

          <div className={activeSection === "Deeplink" ? "mt-4 xl:mt-0" : "hidden"}>
            <DeeplinkSection draft={draft} change={change} />
          </div>
          <div className={activeSection === "Geo" ? "mt-4 xl:mt-0" : "hidden"}>
            <GeoSection draft={draft} change={change} />
          </div>
          <div className={activeSection === "Shield" ? "mt-4 xl:mt-0" : "hidden"}>
            <ShieldSection draft={draft} change={change} />
          </div>
          <div className={activeSection === "Tracking" ? "mt-4 xl:mt-0" : "hidden"}>
            <TrackingSection draft={draft} change={change} />
          </div>
        </div>
      </div>

      {activeSection !== "Page" && (
        <div className="sticky bottom-3 z-40 mt-6 rounded-2xl border border-zinc-200/90 bg-white/95 p-3 shadow-[0_14px_40px_rgba(24,24,27,0.16)] backdrop-blur lg:hidden">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <p className="text-[11px] font-bold text-zinc-500">{dirty ? "Unsaved Smart Link changes" : "Smart Link settings are saved"}</p>
            <StatusBadge status={draft.status} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={!dirty || saving} onClick={() => void saveSmartLink()} className="text-zinc-900">
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? "Saving…" : saved ? "Saved" : "Save"}
            </Button>
            <Button
              variant={draft.status === "PUBLISHED" ? "secondary" : "primary"}
              disabled={saving}
              onClick={() => void saveSmartLink(draft.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}
              className="font-black"
            >
              <Send size={16} />
              {draft.status === "PUBLISHED" ? "Draft" : "Publish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
