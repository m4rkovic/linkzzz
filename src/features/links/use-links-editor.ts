"use client";

import { useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useProfile } from "@/features/profile/profile-context";
import type { PublicProfileData, PublicProfileLink } from "@/types/profile";
import type { LinkDraft } from "@/features/links/link-editor-types";
import { MAX_LINKS } from "@/features/links/link-config";
import {
  applyDraftToLink,
  createEmptyDraft,
  createLinkFromDraft,
  linkToDraft,
  normalizeDraft,
  revokeUnsavedImage,
  validateDraft,
} from "@/features/links/link-editor-model";

export function useLinksEditor() {
  const { profile, setProfile, saveProfile, saving } = useProfile();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<LinkDraft>(() =>
    createEmptyDraft(profile.appearance.cards?.defaultLayout ?? "button"),
  );
  const links = profile.links;

  const previewProfile = useMemo<PublicProfileData>(() => {
    if (editingId) {
      return {
        ...profile,
        links: profile.links.map((link) =>
          link.id === editingId ? applyDraftToLink(link, draft) : link,
        ),
      };
    }
    if (creatingNew) {
      return {
        ...profile,
        links: [...profile.links, createLinkFromDraft("__preview__", draft)],
      };
    }
    return profile;
  }, [profile, editingId, creatingNew, draft]);

  async function commitLinks(nextLinks: PublicProfileLink[]) {
    const previousProfile = profile;
    const nextProfile = { ...profile, links: nextLinks };
    setProfile(nextProfile);

    const result = await saveProfile(nextProfile);
    if (!result.ok) {
      setProfile(previousProfile);
      setError(result.error);
      return false;
    }

    return true;
  }

  function beginCreate() {
    if (links.length >= MAX_LINKS || saving) return;
    setEditingId(null);
    setCreatingNew(true);
    setError("");
    setDraft(createEmptyDraft(profile.appearance.cards?.defaultLayout ?? "button"));
  }

  function beginEdit(link: PublicProfileLink) {
    if (saving) return;
    if (creatingNew || (editingId && editingId !== link.id)) {
      revokeUnsavedImage(draft, editingId, links);
    }
    setCreatingNew(false);
    setEditingId(link.id);
    setError("");
    setDraft(linkToDraft(link, profile));
  }

  function cancelEditor() {
    if (saving) return;
    revokeUnsavedImage(draft, editingId, links);
    setEditingId(null);
    setCreatingNew(false);
    setError("");
  }

  async function saveNewLink() {
    const validation = validateDraft(draft);
    if (validation) return setError(validation);
    const normalized = normalizeDraft(draft);
    const nextLinks = [
      ...links,
      createLinkFromDraft(crypto.randomUUID(), normalized),
    ];

    setError("");
    if (await commitLinks(nextLinks)) {
      setCreatingNew(false);
    }
  }

  async function saveExistingLink() {
    if (!editingId) return;
    const validation = validateDraft(draft);
    if (validation) return setError(validation);
    const normalized = normalizeDraft(draft);
    const original = links.find((link) => link.id === editingId);
    const nextLinks = links.map((link) =>
      link.id === editingId ? applyDraftToLink(link, normalized) : link,
    );

    setError("");
    if (await commitLinks(nextLinks)) {
      if (
        original?.imageUrl?.startsWith("blob:") &&
        original.imageUrl !== normalized.imageUrl
      ) {
        URL.revokeObjectURL(original.imageUrl);
      }
      setEditingId(null);
    }
  }

  async function toggleVisibility(id: string) {
    if (saving) return;
    setError("");
    await commitLinks(
      links.map((link) =>
        link.id === id ? { ...link, visible: !link.visible } : link,
      ),
    );
  }

  async function deleteLink(id: string) {
    if (saving || !window.confirm("Delete this link?")) return;
    const existing = links.find((link) => link.id === id);
    setError("");

    if (await commitLinks(links.filter((link) => link.id !== id))) {
      if (existing?.imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(existing.imageUrl);
      }
      if (editingId === id) setEditingId(null);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (saving) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((link) => link.id === active.id);
    const newIndex = links.findIndex((link) => link.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setError("");
    await commitLinks(arrayMove(links, oldIndex, newIndex));
  }

  return {
    profile,
    links,
    previewProfile,
    editingId,
    creatingNew,
    error,
    draft,
    setDraft,
    saving,
    usagePercentage: Math.min((links.length / MAX_LINKS) * 100, 100),
    beginCreate,
    beginEdit,
    cancelEditor,
    saveNewLink,
    saveExistingLink,
    toggleVisibility,
    deleteLink,
    handleDragEnd,
  };
}
