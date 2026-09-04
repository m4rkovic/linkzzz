"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Link2, Plus } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import ProfilePreviewFrame from "@/components/ui/profile-preview-frame";
import type { PublicProfileData, VisitorLocation } from "@/types/profile";
import LinkEditorForm from "./editor/link-editor-form";
import CampaignEditor from "./campaign-editor";
import VisitorMessagingEditor from "./visitor-messaging-editor";
import SortableLinkCard from "./editor/sortable-link-card";
import { useLinksEditor } from "@/features/links/use-links-editor";

const mockVisitor: VisitorLocation = { countryCode: "RS", countryName: "Serbia", flag: "🇷🇸" };

export default function LinksEditor({
  showPreview = true,
  onPreviewProfileChange,
}: {
  showPreview?: boolean;
  onPreviewProfileChange?: (profile: PublicProfileData) => void;
}) {
  const editor = useLinksEditor();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    onPreviewProfileChange?.(editor.previewProfile);
  }, [editor.previewProfile, onPreviewProfileChange]);

  return (
    <div className={`grid w-full min-w-0 max-w-full gap-6 ${showPreview ? "2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-8" : ""}`}>
      <div className="min-w-0 space-y-6">
        <LinksSummary count={editor.links.length} limit={editor.limit} usagePercentage={editor.usagePercentage} visual={editor.profile.appearance.layoutMode === "visual"} />
        <CampaignEditor />
        <VisitorMessagingEditor />

        {!editor.creatingNew && !editor.editingId && (
          <button
            type="button"
            onClick={editor.beginCreate}
            disabled={editor.links.length >= editor.limit}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-violet-strong px-5 text-sm font-black text-white shadow-sm transition hover:bg-brand-violet disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/25"
          >
            <Plus size={18} /> Add link
          </button>
        )}

        {editor.creatingNew && (
          <section className="relative overflow-hidden rounded-2xl border border-brand-violet/40 bg-white p-4 shadow-sm sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-violet via-brand-violet-strong to-brand-lime" />
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet-strong">New link</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950">Create link</h2>
            <p className="mt-1 text-sm text-zinc-500">Use the settings groups below to configure the card without one endless form.</p>
            <div className="mt-5"><LinkEditorForm draft={editor.draft} setDraft={editor.setDraft} error={editor.error} onSave={editor.saveNewLink} onCancel={editor.cancelEditor} /></div>
          </section>
        )}

        <DndContext id="links-dnd-context" sensors={sensors} collisionDetection={closestCenter} onDragEnd={editor.handleDragEnd}>
          <SortableContext items={editor.links.map((link) => link.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {editor.links.map((link) => (
                <SortableLinkCard
                  key={link.id}
                  link={link}
                  editing={editor.editingId === link.id}
                  draft={editor.draft}
                  setDraft={editor.setDraft}
                  error={editor.editingId === link.id ? editor.error : ""}
                  onEdit={() => editor.beginEdit(link)}
                  onSave={editor.saveExistingLink}
                  onCancel={editor.cancelEditor}
                  onToggle={() => editor.toggleVisibility(link.id)}
                  onDelete={() => setPendingDeleteId(link.id)}
                  featured={editor.profile.engagement?.featuredLinkId === link.id}
                  campaignPrimary={editor.profile.engagement?.campaign?.primaryLinkId === link.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {editor.links.length === 0 && !editor.creatingNew && (
          <div className="rounded-2xl border border-dashed border-brand-violet/30 bg-brand-violet-soft/30 px-6 py-12 text-center">
            <Link2 size={24} className="mx-auto text-brand-violet" />
            <p className="mt-4 text-sm font-semibold text-zinc-800">No links yet</p>
            <p className="mt-1 text-xs text-zinc-500">Add your first public link.</p>
          </div>
        )}
      </div>

      {showPreview && (
        <ProfilePreviewFrame
          profile={editor.previewProfile}
          visitor={mockVisitor}
          subtitle="Changes update instantly"
          badge="RS"
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete this page link?"
        description="The link will be removed from this Landing Page. The rest of the page stays unchanged."
        confirmLabel="Delete link"
        destructive
        busy={editor.saving}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          await editor.deleteLink(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

function LinksSummary({ count, limit, usagePercentage, visual }: { count: number; limit: number; usagePercentage: number; visual: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="absolute -right-10 -top-14 h-32 w-32 rounded-full bg-brand-violet-soft blur-2xl" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-violet-strong">Page cards</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-950">Links</h2>
          <p className="mt-1 text-sm text-zinc-500">Build buttons, image cards and featured content.</p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-lime-soft px-3 py-1.5 text-sm font-black text-zinc-950">{count} / {limit}</span>
      </div>
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-violet-strong to-brand-lime" style={{ width: `${usagePercentage}%` }} />
      </div>
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-violet-soft px-2.5 py-1 text-[11px] font-semibold text-brand-violet-strong">Profile: {visual ? "Visual" : "Classic"}</span>
        {!visual && <span className="text-xs text-zinc-400">Visual tiles are shown when Visual layout is enabled.</span>}
      </div>
    </section>
  );
}
