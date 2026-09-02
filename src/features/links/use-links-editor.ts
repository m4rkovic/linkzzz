"use client";

import { useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useProfile } from "@/features/profile/profile-context";
import { useToast } from "@/components/ui/toast";
import type { PublicProfileData, PublicProfileLink } from "@/types/profile";
import type { LinkDraft } from "@/features/links/link-editor-types";
import { sanitizeEngagementForLinks } from "@/features/engagement/profile-engagement";
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
  const { profile, setProfile, saveProfile, saving, pageLinkLimit } = useProfile();
  const { pushToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<LinkDraft>(() =>
    createEmptyDraft(profile.appearance.cards?.defaultLayout ?? "button"),
  );
  const links = profile.links;

  const previewProfile = useMemo<PublicProfileData>(() => {
    if (editingId) {
      const previewLink = profile.links.find((link) => link.id === editingId);
      const previewLinks = profile.links.map((link) =>
        link.id === editingId ? applyDraftToLink(link, draft) : link,
      );
      const focusedId = previewLink && draft.customStyle.focusEffect !== "none" ? editingId : undefined;
      return {
        ...profile,
        links: makeFocusExclusive(previewLinks, focusedId),
      };
    }
    if (creatingNew) {
      const previewLink = createLinkFromDraft("__preview__", draft);
      return {
        ...profile,
        links: makeFocusExclusive(
          [...profile.links, previewLink],
          draft.customStyle.focusEffect !== "none" ? previewLink.id : undefined,
        ),
      };
    }
    return profile;
  }, [profile, editingId, creatingNew, draft]);

  async function commitLinks(nextLinks: PublicProfileLink[], successMessage?: string) {
    const previousProfile = profile;
    const nextProfile = {
      ...profile,
      links: nextLinks,
      engagement: sanitizeEngagementForLinks(profile.engagement, nextLinks),
    };
    setProfile(nextProfile);

    const result = await saveProfile(nextProfile);
    if (!result.ok) {
      if (result.code !== "PROFILE_CONFLICT") {
        setProfile(previousProfile);
      }
      setError(result.error);
      pushToast({ title: "Link update failed", description: result.error, tone: "error" });
      return false;
    }

    if (successMessage) pushToast({ title: successMessage, tone: "success" });
    return true;
  }

  function beginCreate() {
    if (links.length >= pageLinkLimit || saving) return;
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
    const newLink = createLinkFromDraft(crypto.randomUUID(), normalized);
    const nextLinks = makeFocusExclusive(
      [...links, newLink],
      newLink.customStyle?.focusEffect && newLink.customStyle.focusEffect !== "none"
        ? newLink.id
        : undefined,
    );

    setError("");
    if (await commitLinks(nextLinks, "Link added")) {
      setCreatingNew(false);
    }
  }

  async function saveExistingLink() {
    if (!editingId) return;
    const validation = validateDraft(draft);
    if (validation) return setError(validation);
    const normalized = normalizeDraft(draft);
    const original = links.find((link) => link.id === editingId);
    const editedLink = original ? applyDraftToLink(original, normalized) : undefined;
    const nextLinks = makeFocusExclusive(
      links.map((link) =>
        link.id === editingId ? applyDraftToLink(link, normalized) : link,
      ),
      editedLink?.customStyle?.focusEffect && editedLink.customStyle.focusEffect !== "none"
        ? editingId
        : undefined,
    );

    setError("");
    if (await commitLinks(nextLinks, "Link updated")) {
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
      "Link visibility updated",
    );
  }

  async function deleteLink(id: string) {
    if (saving) return;
    const existing = links.find((link) => link.id === id);
    setError("");

    if (await commitLinks(links.filter((link) => link.id !== id), "Link deleted")) {
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
    await commitLinks(arrayMove(links, oldIndex, newIndex), "Link order saved");
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
    limit: pageLinkLimit,
    usagePercentage: pageLinkLimit > 0 ? Math.min((links.length / pageLinkLimit) * 100, 100) : 100,
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


function makeFocusExclusive(links: PublicProfileLink[], focusedId?: string) {
  if (!focusedId) return links;
  return links.map((link) => {
    if (link.id === focusedId || !link.customStyle?.focusEffect || link.customStyle.focusEffect === "none") {
      return link;
    }
    return {
      ...link,
      customStyle: { ...link.customStyle, focusEffect: "none" as const },
    };
  });
}
