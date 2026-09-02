import type { LucideIcon } from "lucide-react";

import type { PersistedProfileData } from "@/types/persisted-profile";
import type { SmartLinkEditableData, SmartLinkRecord } from "@/types/smart-link";

export type SerializableSmartLink = Omit<SmartLinkRecord, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type InitialPage = {
  profile: PersistedProfileData;
  revision: number;
};

export type EditorSection = "Link" | "Page" | "Deeplink" | "Geo" | "Shield" | "Tracking";
export type PageSection = "Profile" | "Appearance" | "Cards" | "Blocks";

export type SectionDefinition = {
  id: EditorSection;
  label: string;
  icon: LucideIcon;
  group: "Essential" | "Advanced";
};

export type SmartLinkChangeHandler = (patch: Partial<SmartLinkEditableData>) => void;

