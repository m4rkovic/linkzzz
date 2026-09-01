"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Link2, Plus } from "lucide-react";
import ProfilePreviewFrame from "@/components/ui/profile-preview-frame";
import type { VisitorLocation } from "@/types/profile";
import LinkEditorForm from "./editor/link-editor-form";
import SortableLinkCard from "./editor/sortable-link-card";
import { MAX_LINKS } from "@/features/links/link-config";
import { useLinksEditor } from "@/features/links/use-links-editor";

const mockVisitor: VisitorLocation = { countryCode: "RS", countryName: "Serbia", flag: "🇷🇸" };

export default function LinksEditor() {
  const editor = useLinksEditor();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <div className="grid w-full min-w-0 max-w-full gap-6 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-8">
      <div className="min-w-0 space-y-6">
        <LinksSummary count={editor.links.length} usagePercentage={editor.usagePercentage} visual={editor.profile.appearance.layoutMode === "visual"} />

        {!editor.creatingNew && !editor.editingId && (
          <button type="button" onClick={editor.beginCreate} disabled={editor.links.length >= MAX_LINKS} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
            <Plus size={18} /> Add link
          </button>
        )}

        {editor.creatingNew && (
          <section className="rounded-2xl border-2 border-zinc-950 bg-white p-4 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">New link</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950">Create link</h2>
            <div className="mt-6"><LinkEditorForm draft={editor.draft} setDraft={editor.setDraft} error={editor.error} onSave={editor.saveNewLink} onCancel={editor.cancelEditor} /></div>
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
                  onDelete={() => editor.deleteLink(link.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {editor.links.length === 0 && !editor.creatingNew && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <Link2 size={24} className="mx-auto text-zinc-300" />
            <p className="mt-4 text-sm font-semibold text-zinc-800">No links yet</p>
            <p className="mt-1 text-xs text-zinc-400">Add your first public link.</p>
          </div>
        )}
      </div>

      <ProfilePreviewFrame profile={editor.previewProfile} visitor={mockVisitor} subtitle="Changes update instantly" badge="RS" />
    </div>
  );
}

function LinksSummary({ count, usagePercentage, visual }: { count: number; usagePercentage: number; visual: boolean }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-lg font-semibold text-zinc-950">Links</h2><p className="mt-1 text-sm text-zinc-500">Build buttons, image cards and featured content.</p></div>
        <span className="shrink-0 text-sm font-bold text-zinc-950">{count} / {MAX_LINKS}</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-zinc-950" style={{ width: `${usagePercentage}%` }} /></div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">Profile: {visual ? "Visual" : "Classic"}</span>
        {!visual && <span className="text-xs text-zinc-400">Visual tiles are shown when Visual layout is enabled.</span>}
      </div>
    </section>
  );
}
