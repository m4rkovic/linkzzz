"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { DestinationPicker } from "@/components/destinations/destination-picker";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { getPlatformIcon, platformToProviderId, providerToPlatformId } from "@/config/platforms";
import { getDestinationProvider } from "@/features/destinations/provider-registry";
import { useProfile } from "@/features/profile/profile-context";
import type { PublicSocialLink } from "@/types/profile";
import type { DestinationConfig } from "@/types/smart-link";

export default function SocialLinksEditor() {
  const { profile, setProfile } = useProfile();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DestinationConfig>(() => emptySocialDestination());
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const socials = profile.socials;

  function updateSocials(updater: (current: PublicSocialLink[]) => PublicSocialLink[]) {
    setProfile((current) => ({ ...current, socials: updater(current.socials) }));
  }

  function openAdd() {
    setEditingId(null);
    setDraft(emptySocialDestination());
    setError("");
    setAdding(true);
  }

  function addSocial() {
    if (!draft.url) {
      setError("Choose a provider and enter a valid destination first.");
      return;
    }
    const platform = providerToPlatformId(draft.provider);
    const definition = getDestinationProvider(draft.provider);
    const newSocial: PublicSocialLink = {
      id: crypto.randomUUID(),
      name: draft.label?.trim() || definition.name,
      url: draft.url,
      visible: true,
      platform,
      icon: getPlatformIcon(platform),
    };
    updateSocials((current) => [...current, newSocial]);
    setAdding(false);
    setDraft(emptySocialDestination());
    setError("");
  }

  function startEditing(social: PublicSocialLink) {
    const provider = platformToProviderId(social.platform ?? "custom");
    setAdding(false);
    setEditingId(social.id);
    setDraft({ provider, value: social.url, url: social.url, label: social.name });
    setError("");
  }

  function saveEdit(id: string) {
    if (!draft.url) {
      setError("Enter a valid social destination before saving.");
      return;
    }
    const platform = providerToPlatformId(draft.provider);
    const definition = getDestinationProvider(draft.provider);
    updateSocials((current) => current.map((social) => social.id === id ? {
      ...social,
      name: draft.label?.trim() || definition.name,
      url: draft.url,
      platform,
      icon: getPlatformIcon(platform),
    } : social));
    cancelEdit();
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptySocialDestination());
    setError("");
  }

  function toggleVisibility(id: string) {
    updateSocials((current) => current.map((social) => social.id === id ? { ...social, visible: !social.visible } : social));
  }

  function deleteSocial(id: string) {
    updateSocials((current) => current.filter((social) => social.id !== id));
    if (editingId === id) cancelEdit();
    setPendingDeleteId(null);
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Social links</h2>
          <p className="mt-1 text-sm text-zinc-500">Add provider-aware social profiles without keeping a wall of empty URL fields around.</p>
        </div>
        <button type="button" onClick={openAdd} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto">
          <Plus size={17} /> Add social
        </button>
      </div>

      {adding && (
        <div className="mt-6 rounded-2xl bg-zinc-50 p-3 sm:p-4">
          <DestinationPicker value={draft} onChange={(value) => { setDraft(value); setError(""); }} title="Social destination" showFallback={false} />
          {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button type="button" onClick={() => { setAdding(false); setDraft(emptySocialDestination()); setError(""); }} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700"><X size={16} /> Cancel</button>
            <button type="button" onClick={addSocial} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white"><Plus size={16} /> Add</button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {socials.map((social) => {
          const Icon = social.icon;
          const editing = editingId === social.id;
          return (
            <article key={social.id} className="rounded-2xl border border-zinc-200 p-4">
              {editing ? (
                <div>
                  <DestinationPicker value={draft} onChange={(value) => { setDraft(value); setError(""); }} title="Edit social" showFallback={false} compact />
                  {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => saveEdit(social.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm font-semibold text-white"><Save size={16} /> Save</button>
                    <button type="button" onClick={cancelEdit} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700"><X size={16} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white"><Icon size={17} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900">{social.name}</p>
                      {!social.visible && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">Hidden</span>}
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-400">{social.url}</p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <IconButton label={social.visible ? "Hide" : "Show"} onClick={() => toggleVisibility(social.id)}>{social.visible ? <Eye size={17} /> : <EyeOff size={17} />}</IconButton>
                    <IconButton label="Edit" onClick={() => startEditing(social)}><Pencil size={16} /></IconButton>
                    <IconButton label="Delete" danger onClick={() => setPendingDeleteId(social.id)}><Trash2 size={16} /></IconButton>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {socials.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 px-5 py-10 text-center">
          <p className="text-sm font-semibold text-zinc-800">No social links</p>
          <p className="mt-1 text-xs text-zinc-400">Add your first provider from the shared destination library.</p>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Remove social link?"
        description="The social destination will be removed from this page. Save the Page to persist the change."
        confirmLabel="Remove"
        destructive
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => { if (pendingDeleteId) deleteSocial(pendingDeleteId); }}
      />
    </section>
  );
}

function emptySocialDestination(): DestinationConfig {
  return { provider: "INSTAGRAM", value: "", url: "" };
}

function IconButton({ label, onClick, danger = false, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={`flex h-10 w-9 items-center justify-center rounded-xl transition sm:w-10 ${danger ? "text-zinc-400 hover:bg-red-50 hover:text-red-600" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"}`}>
      {children}
    </button>
  );
}
