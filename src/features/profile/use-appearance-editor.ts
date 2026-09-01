"use client";

import { useState, type ChangeEvent } from "react";
import { defaultAppearance } from "@/config/profile-defaults";
import { useProfile } from "@/features/profile/profile-context";
import type {
  CardAppearance,
  HeroAppearance,
  IdentityAppearance,
  PageAppearance,
  ProfileLayoutMode,
} from "@/types/profile";
import type { AppearancePreset } from "@/features/profile/appearance-presets";

export function useAppearanceEditor() {
  const { profile, setProfile, saveProfile, saving } = useProfile();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const appearance = profile.appearance;
  const page: PageAppearance = { ...defaultAppearance.page!, ...appearance.page };
  const hero: HeroAppearance = { ...defaultAppearance.hero!, ...appearance.hero };
  const identity: IdentityAppearance = { ...defaultAppearance.identity!, ...appearance.identity };
  const cards: CardAppearance = { ...defaultAppearance.cards!, ...appearance.cards };
  const layoutMode = appearance.layoutMode ?? "classic";

  function updateAppearance(values: Partial<typeof appearance>) {
    setProfile((current) => ({
      ...current,
      appearance: { ...current.appearance, ...values },
    }));
  }

  function updatePage(values: Partial<PageAppearance>) {
    updateAppearance({ page: { ...page, ...values } });
  }

  function updateHero(values: Partial<HeroAppearance>) {
    updateAppearance({ hero: { ...hero, ...values } });
  }

  function updateIdentity(values: Partial<IdentityAppearance>) {
    updateAppearance({ identity: { ...identity, ...values } });
  }

  function updateCards(values: Partial<CardAppearance>) {
    updateAppearance({ cards: { ...cards, ...values } });
  }

  function changeLayoutMode(mode: ProfileLayoutMode) {
    updateAppearance({ layoutMode: mode });
  }

  function applyPreset(preset: AppearancePreset) {
    const next = preset.apply();
    setProfile((current) => ({
      ...current,
      appearance: { ...current.appearance, ...next },
    }));
  }

  function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);

    setProfile((current) => {
      if (current.coverImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.coverImageUrl);
      }
      return {
        ...current,
        coverImageUrl: objectUrl,
        appearance: {
          ...current.appearance,
          hero: { ...defaultAppearance.hero!, ...current.appearance.hero, enabled: true },
        },
      };
    });
    event.target.value = "";
  }

  function removeCover() {
    if (profile.coverImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profile.coverImageUrl);
    }
    setProfile((current) => ({ ...current, coverImageUrl: undefined }));
  }

  function resetAppearance() {
    const confirmed = window.confirm("Reset appearance to the default Linkzzz style?");
    if (!confirmed) return;
    if (profile.coverImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profile.coverImageUrl);
    }
    setProfile((current) => ({ ...current, coverImageUrl: undefined, appearance: { ...defaultAppearance } }));
  }

  async function saveChanges() {
    setSaved(false);
    setSaveError("");
    const result = await saveProfile();
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return {
    profile,
    saved,
    saveError,
    saving,
    appearance,
    page,
    hero,
    identity,
    cards,
    layoutMode,
    updateAppearance,
    updatePage,
    updateHero,
    updateIdentity,
    updateCards,
    changeLayoutMode,
    applyPreset,
    handleCoverUpload,
    removeCover,
    resetAppearance,
    saveChanges,
  };
}
