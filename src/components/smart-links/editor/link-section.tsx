"use client";

import { FileText, Route } from "lucide-react";

import { DestinationPicker } from "@/components/destinations/destination-picker";
import CustomDomainManager from "@/components/smart-links/custom-domain-manager";
import type { SmartLinkEditableData, SmartLinkRecord } from "@/types/smart-link";

import { EditorPanel, Field, inputClass } from "./editor-primitives";
import { emptyDestination, normalizeSlug } from "./editor-utils";
import type { SmartLinkChangeHandler } from "./types";

export function LinkSection({
  smartLinkId,
  type,
  draft,
  change,
}: {
  smartLinkId: string;
  type: SmartLinkRecord["type"];
  draft: SmartLinkEditableData;
  change: SmartLinkChangeHandler;
}) {
  return (
    <EditorPanel
      eyebrow="Smart Link core"
      title="Public URL and destination"
      description="These settings belong to this Smart Link. Page content, geo rules and redirect behavior sit underneath this public URL."
    >
      <div className="grid gap-5">
        <Field label="Name">
          <input
            value={draft.title}
            maxLength={120}
            onChange={(event) => change({ title: event.target.value })}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Public URL" hint="Lowercase letters, numbers, hyphen and underscore only.">
        <div className="flex min-w-0 items-center rounded-xl border border-zinc-200 bg-white focus-within:border-brand-violet focus-within:ring-4 focus-within:ring-brand-violet/10">
          <span className="shrink-0 pl-3 text-sm text-zinc-400">linkzzz.com/</span>
          <input
            value={draft.slug}
            onChange={(event) => change({ slug: normalizeSlug(event.target.value) })}
            className="min-h-11 min-w-0 flex-1 rounded-xl px-1 pr-3 text-sm outline-none"
          />
        </div>
      </Field>

      <div className="rounded-2xl bg-brand-violet-soft p-4">
        <div className="flex items-center gap-2">
          {type === "LANDING_PAGE" ? <FileText size={17} /> : <Route size={17} />}
          <p className="text-sm font-black text-zinc-900">
            {type === "LANDING_PAGE" ? "Landing Page" : "Direct Link"}
          </p>
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Smart Link type is fixed after creation in this phase. That avoids turning an existing page into a redirect by accident, which would be a particularly creative way to ruin someone&apos;s campaign.
        </p>
      </div>

      {type === "DIRECT" && (
        <DestinationPicker
          value={draft.primaryDestination ?? emptyDestination()}
          onChange={(primaryDestination) => change({ primaryDestination })}
          title="Primary destination"
        />
      )}

      <CustomDomainManager smartLinkId={smartLinkId} />
    </EditorPanel>
  );
}
