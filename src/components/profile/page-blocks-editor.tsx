"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LayoutTemplate,
  Mail,
  Minus,
  Plus,
  Space,
  Trash2,
  Type,
  Video,
  Timer,
  Save,
} from "lucide-react";

import UserContentImage from "@/components/ui/user-content-image";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useProfile } from "@/features/profile/profile-context";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/features/scheduling/schedule";
import type { PageContentBlock, PageBlockGalleryImage } from "@/types/profile";

const inputClass =
  "min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-950";
const textAreaClass = `${inputClass} min-h-24 resize-y py-3`;

const ADD_OPTIONS: Array<{
  type: PageContentBlock["type"];
  label: string;
  description: string;
  icon: typeof Type;
}> = [
  { type: "TEXT", label: "Text", description: "Heading and rich page copy.", icon: Type },
  { type: "CTA", label: "CTA banner", description: "Focused call-to-action block.", icon: LayoutTemplate },
  { type: "EMAIL_CAPTURE", label: "Email capture", description: "Collect visitor email addresses.", icon: Mail },
  { type: "COUNTDOWN", label: "Countdown", description: "Live timer to a launch, event or deadline.", icon: Timer },
  { type: "GALLERY", label: "Gallery", description: "2–4 column image strip or grid.", icon: ImagePlus },
  { type: "EMBED", label: "Media embed", description: "YouTube or Spotify embed.", icon: Video },
  { type: "DIVIDER", label: "Divider", description: "Separate page sections.", icon: Minus },
  { type: "SPACER", label: "Spacer", description: "Add intentional breathing room.", icon: Space },
];

export default function PageBlocksEditor() {
  const { profile, setProfile, saveProfile, saving, dirty } = useProfile();
  const { pushToast } = useToast();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const blocks = profile.contentBlocks;

  function updateBlocks(next: PageContentBlock[]) {
    setProfile((current) => ({ ...current, contentBlocks: next }));
  }

  function addBlock(type: PageContentBlock["type"]) {
    updateBlocks([...blocks, createBlock(type)]);
  }

  function updateBlock(id: string, next: PageContentBlock) {
    updateBlocks(blocks.map((block) => (block.id === id ? next : block)));
  }

  function moveBlock(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    updateBlocks(next);
  }

  async function saveBlocks() {
    const result = await saveProfile();
    if (!result.ok) {
      pushToast({ title: "Page save failed", description: result.error, tone: "error" });
      return;
    }
    pushToast({ title: "Page blocks saved", tone: "success" });
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Page builder</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950">Content blocks</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
            Add supporting content below your link cards. Blocks are independent from cards and keep their own order.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-600">
          {blocks.length} / 30 blocks
        </span>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {ADD_OPTIONS.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            disabled={blocks.length >= 30}
            className="group rounded-2xl border border-zinc-200 p-3 text-left transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <Icon size={16} />
            </div>
            <p className="mt-3 text-sm font-black text-zinc-950">{label}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {blocks.length === 0 && (
          <EmptyState
            icon={<LayoutTemplate size={21} />}
            title="No content blocks yet"
            description="Cards and socials still render normally. Add a text, CTA, countdown, gallery or another block when you need more content."
            className="bg-zinc-50"
          />
        )}

        {blocks.map((block, index) => (
          <BlockEditor
            key={block.id}
            block={block}
            index={index}
            count={blocks.length}
            onChange={(next) => updateBlock(block.id, next)}
            onDelete={() => setPendingDeleteId(block.id)}
            onMove={(delta) => moveBlock(index, delta)}
          />
        ))}
      </div>

      <div className="sticky bottom-3 z-30 mt-5 rounded-2xl border border-zinc-200/90 bg-white/95 p-3 shadow-[0_14px_40px_rgba(24,24,27,0.12)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p className={`mb-2 text-xs font-semibold sm:mb-0 ${dirty ? "text-amber-700" : "text-zinc-500"}`}>
          {dirty ? "Unsaved Page block changes" : "All Page block changes are saved"}
        </p>
        <Button variant="primary" onClick={() => void saveBlocks()} disabled={saving || !dirty} className="w-full sm:w-auto">
          <Save size={16} /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete content block?"
        description="This block will be removed from the Page. Save the Page to persist the deletion."
        confirmLabel="Delete block"
        destructive
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return;
          updateBlocks(blocks.filter((candidate) => candidate.id !== pendingDeleteId));
          setPendingDeleteId(null);
        }}
      />
    </section>
  );
}

function BlockEditor({
  block,
  index,
  count,
  onChange,
  onDelete,
  onMove,
}: {
  block: PageContentBlock;
  index: number;
  count: number;
  onChange: (block: PageContentBlock) => void;
  onDelete: () => void;
  onMove: (delta: -1 | 1) => void;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            {blockIcon(block.type)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-zinc-950">{blockLabel(block.type)}</p>
            <p className="text-xs text-zinc-400">Block {index + 1}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-25" aria-label="Move block up"><ArrowUp size={15} /></button>
          <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-25" aria-label="Move block down"><ArrowDown size={15} /></button>
          <button type="button" onClick={onDelete} className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete block"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input type="checkbox" checked={block.visible} onChange={(event) => onChange({ ...block, visible: event.target.checked } as PageContentBlock)} className="h-4 w-4" />
        <span className="text-xs font-bold text-zinc-600">Visible on public page</span>
      </div>

      <BlockScheduleFields block={block} onChange={onChange} />

      <div className="mt-4">
        {block.type === "TEXT" && <TextFields block={block} onChange={onChange} />}
        {block.type === "CTA" && <CtaFields block={block} onChange={onChange} />}
        {block.type === "EMAIL_CAPTURE" && <EmailFields block={block} onChange={onChange} />}
        {block.type === "COUNTDOWN" && <CountdownFields block={block} onChange={onChange} />}
        {block.type === "GALLERY" && <GalleryFields block={block} onChange={onChange} />}
        {block.type === "EMBED" && <EmbedFields block={block} onChange={onChange} />}
        {block.type === "DIVIDER" && <DividerFields block={block} onChange={onChange} />}
        {block.type === "SPACER" && <SpacerFields block={block} onChange={onChange} />}
      </div>
    </article>
  );
}

function TextFields({ block, onChange }: ExtractedProps<"TEXT">) {
  return <div className="grid gap-4">
    <Field label="Heading"><input className={inputClass} value={block.heading ?? ""} onChange={(e) => onChange({ ...block, heading: e.target.value || undefined })} placeholder="A little more about me" /></Field>
    <Field label="Body"><textarea className={textAreaClass} value={block.body} onChange={(e) => onChange({ ...block, body: e.target.value })} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Alignment"><select className={inputClass} value={block.alignment} onChange={(e) => onChange({ ...block, alignment: e.target.value as typeof block.alignment })}><option value="left">Left</option><option value="center">Center</option></select></Field>
      <Field label="Surface"><select className={inputClass} value={block.surface} onChange={(e) => onChange({ ...block, surface: e.target.value as typeof block.surface })}><option value="plain">Plain</option><option value="card">Card</option></select></Field>
    </div>
  </div>;
}

function CtaFields({ block, onChange }: ExtractedProps<"CTA">) {
  return <div className="grid gap-4">
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Title"><input className={inputClass} value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} /></Field><Field label="Button text"><input className={inputClass} value={block.buttonText} onChange={(e) => onChange({ ...block, buttonText: e.target.value })} /></Field></div>
    <Field label="Description"><input className={inputClass} value={block.description ?? ""} onChange={(e) => onChange({ ...block, description: e.target.value || undefined })} /></Field>
    <Field label="Destination URL"><input className={inputClass} type="url" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} /></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Alignment"><select className={inputClass} value={block.alignment} onChange={(e) => onChange({ ...block, alignment: e.target.value as typeof block.alignment })}><option value="left">Left</option><option value="center">Center</option></select></Field><Field label="Style"><select className={inputClass} value={block.style} onChange={(e) => onChange({ ...block, style: e.target.value as typeof block.style })}><option value="solid">Solid</option><option value="outline">Outline</option><option value="glass">Glass</option></select></Field></div>
  </div>;
}

function EmailFields({ block, onChange }: ExtractedProps<"EMAIL_CAPTURE">) {
  return <div className="grid gap-4">
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Title"><input className={inputClass} value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} /></Field><Field label="Button text"><input className={inputClass} value={block.buttonText} onChange={(e) => onChange({ ...block, buttonText: e.target.value })} /></Field></div>
    <Field label="Description"><input className={inputClass} value={block.description ?? ""} onChange={(e) => onChange({ ...block, description: e.target.value || undefined })} /></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Input placeholder"><input className={inputClass} value={block.placeholder} onChange={(e) => onChange({ ...block, placeholder: e.target.value })} /></Field><Field label="Success message"><input className={inputClass} value={block.successMessage} onChange={(e) => onChange({ ...block, successMessage: e.target.value })} /></Field></div>
  </div>;
}

function BlockScheduleFields({
  block,
  onChange,
}: {
  block: PageContentBlock;
  onChange: (block: PageContentBlock) => void;
}) {
  const scheduled = Boolean(block.visibleFrom || block.visibleUntil);
  return (
    <details className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2.5" defaultOpen={scheduled}>
      <summary className="cursor-pointer text-xs font-black text-zinc-700">Schedule visibility</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Visible from">
          <input
            type="datetime-local"
            className={inputClass}
            value={toDateTimeLocalValue(block.visibleFrom)}
            onChange={(event) =>
              onChange({
                ...block,
                visibleFrom: fromDateTimeLocalValue(event.target.value),
              } as PageContentBlock)
            }
          />
        </Field>
        <Field label="Visible until">
          <input
            type="datetime-local"
            className={inputClass}
            value={toDateTimeLocalValue(block.visibleUntil)}
            onChange={(event) =>
              onChange({
                ...block,
                visibleUntil: fromDateTimeLocalValue(event.target.value),
              } as PageContentBlock)
            }
          />
        </Field>
      </div>
      {scheduled && (
        <button
          type="button"
          onClick={() =>
            onChange({ ...block, visibleFrom: undefined, visibleUntil: undefined } as PageContentBlock)
          }
          className="mt-3 text-[11px] font-bold text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950"
        >
          Clear schedule
        </button>
      )}
    </details>
  );
}

function CountdownFields({ block, onChange }: ExtractedProps<"COUNTDOWN">) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input className={inputClass} value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} />
        </Field>
        <Field label="Target date & time">
          <input
            type="datetime-local"
            className={inputClass}
            value={toDateTimeLocalValue(block.targetAt)}
            onChange={(e) => {
              const targetAt = fromDateTimeLocalValue(e.target.value);
              if (targetAt) onChange({ ...block, targetAt });
            }}
          />
        </Field>
      </div>
      <Field label="Text after countdown ends">
        <input
          className={inputClass}
          value={block.completionText}
          onChange={(e) => onChange({ ...block, completionText: e.target.value })}
          placeholder="Now live"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Alignment">
          <select className={inputClass} value={block.alignment} onChange={(e) => onChange({ ...block, alignment: e.target.value as typeof block.alignment })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
          </select>
        </Field>
        <Field label="Surface">
          <select className={inputClass} value={block.surface} onChange={(e) => onChange({ ...block, surface: e.target.value as typeof block.surface })}>
            <option value="plain">Plain</option>
            <option value="card">Card</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function GalleryFields({ block, onChange }: ExtractedProps<"GALLERY">) {
  function updateImage(id: string, patch: Partial<PageBlockGalleryImage>) {
    onChange({ ...block, images: block.images.map((image) => image.id === id ? { ...image, ...patch } : image) });
  }
  function addFiles(files: FileList | null) {
    if (!files) return;
    const free = Math.max(0, 12 - block.images.length);
    const images = [...files].slice(0, free).map((file) => ({ id: crypto.randomUUID(), imageUrl: URL.createObjectURL(file), alt: file.name }));
    onChange({ ...block, images: [...block.images, ...images] });
  }
  return <div className="grid gap-4">
    <div className="grid gap-4 sm:grid-cols-3"><Field label="Title"><input className={inputClass} value={block.title ?? ""} onChange={(e) => onChange({ ...block, title: e.target.value || undefined })} /></Field><Field label="Columns"><select className={inputClass} value={block.columns} onChange={(e) => onChange({ ...block, columns: Number(e.target.value) as 2 | 3 | 4 })}><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></Field><Field label="Aspect"><select className={inputClass} value={block.aspectRatio} onChange={(e) => onChange({ ...block, aspectRatio: e.target.value as typeof block.aspectRatio })}><option value="square">Square</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></Field></div>
    <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 text-sm font-bold text-zinc-600 hover:border-zinc-500"><ImagePlus size={16} /> Add gallery images<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} /></label>
    {block.images.length > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{block.images.map((image) => <div key={image.id} className="relative overflow-hidden rounded-xl bg-zinc-100"><UserContentImage src={image.imageUrl ?? ""} alt={image.alt ?? ""} className="aspect-square h-full w-full object-cover" /><button type="button" onClick={() => onChange({ ...block, images: block.images.filter((candidate) => candidate.id !== image.id) })} className="absolute right-1.5 top-1.5 rounded-lg bg-black/70 p-1.5 text-white"><Trash2 size={13} /></button><input value={image.alt ?? ""} onChange={(e) => updateImage(image.id, { alt: e.target.value })} placeholder="Alt text" className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-black/65 px-2 py-1 text-[10px] text-white outline-none placeholder:text-white/60" /></div>)}</div>}
  </div>;
}

function EmbedFields({ block, onChange }: ExtractedProps<"EMBED">) {
  return <div className="grid gap-4 sm:grid-cols-2"><Field label="Title"><input className={inputClass} value={block.title ?? ""} onChange={(e) => onChange({ ...block, title: e.target.value || undefined })} /></Field><Field label="YouTube or Spotify URL"><input className={inputClass} type="url" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} /></Field></div>;
}

function DividerFields({ block, onChange }: ExtractedProps<"DIVIDER">) {
  return <div className="grid gap-4 sm:grid-cols-2"><Field label="Style"><select className={inputClass} value={block.style} onChange={(e) => onChange({ ...block, style: e.target.value as typeof block.style })}><option value="solid">Solid</option><option value="faded">Faded</option></select></Field><Field label={`Thickness (${block.thickness}px)`}><input type="range" min={1} max={8} value={block.thickness} onChange={(e) => onChange({ ...block, thickness: Number(e.target.value) })} className="w-full" /></Field></div>;
}

function SpacerFields({ block, onChange }: ExtractedProps<"SPACER">) {
  return <Field label={`Height (${block.height}px)`}><input type="range" min={8} max={240} step={4} value={block.height} onChange={(e) => onChange({ ...block, height: Number(e.target.value) })} className="w-full" /></Field>;
}

type ExtractedProps<T extends PageContentBlock["type"]> = {
  block: Extract<PageContentBlock, { type: T }>;
  onChange: (block: Extract<PageContentBlock, { type: T }>) => void;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-bold text-zinc-700"><span>{label}</span>{children}</label>;
}

function createBlock(type: PageContentBlock["type"]): PageContentBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "TEXT": return { id, type, visible: true, heading: "About", body: "Add a short piece of text to your page.", alignment: "left", surface: "plain" };
    case "CTA": return { id, type, visible: true, title: "Don’t miss this", description: "Send visitors to your most important destination.", buttonText: "Open", url: "https://example.com", alignment: "center", style: "solid" };
    case "EMAIL_CAPTURE": return { id, type, visible: true, title: "Stay in the loop", description: "Get occasional updates.", placeholder: "you@example.com", buttonText: "Join", successMessage: "You’re in. Thanks!" };
    case "COUNTDOWN": return { id, type, visible: true, title: "Coming soon", targetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), completionText: "Now live", alignment: "center", surface: "card" };
    case "GALLERY": return { id, type, visible: true, title: "Gallery", columns: 3, aspectRatio: "square", images: [] };
    case "EMBED": return { id, type, visible: true, title: "Featured media", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };
    case "DIVIDER": return { id, type, visible: true, style: "faded", thickness: 1 };
    case "SPACER": return { id, type, visible: true, height: 32 };
  }
}

function blockLabel(type: PageContentBlock["type"]) {
  return ADD_OPTIONS.find((option) => option.type === type)?.label ?? type;
}

function blockIcon(type: PageContentBlock["type"]) {
  const Icon = ADD_OPTIONS.find((option) => option.type === type)?.icon ?? Plus;
  return <Icon size={16} />;
}
