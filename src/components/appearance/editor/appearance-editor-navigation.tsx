"use client";

import type { ElementType } from "react";
import {
  ImagePlus,
  MonitorSmartphone,
  MoveVertical,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Type,
  UserRound,
} from "lucide-react";

import { cx } from "@/lib/class-names";
import type { ProfileLayoutMode } from "@/types/profile";

export type AppearancePanel =
  | "layout"
  | "presets"
  | "background"
  | "spacing"
  | "typography"
  | "hero"
  | "identity"
  | "cards"
  | "buttons";

type PanelDefinition = {
  id: AppearancePanel;
  label: string;
  icon: ElementType;
  group: "Page" | "Visual" | "Classic";
};

const commonPanels: PanelDefinition[] = [
  { id: "layout", label: "Layout", icon: MonitorSmartphone, group: "Page" },
  { id: "presets", label: "Presets", icon: Sparkles, group: "Page" },
  { id: "background", label: "Background", icon: Palette, group: "Page" },
  { id: "spacing", label: "Spacing", icon: MoveVertical, group: "Page" },
  { id: "typography", label: "Typography", icon: Type, group: "Page" },
];

const visualPanels: PanelDefinition[] = [
  { id: "hero", label: "Hero", icon: ImagePlus, group: "Visual" },
  { id: "identity", label: "Identity", icon: UserRound, group: "Visual" },
  { id: "cards", label: "Cards", icon: SlidersHorizontal, group: "Visual" },
];

const classicPanels: PanelDefinition[] = [
  { id: "buttons", label: "Buttons", icon: SlidersHorizontal, group: "Classic" },
];

export function getAppearancePanels(layoutMode: ProfileLayoutMode) {
  return [
    ...commonPanels,
    ...(layoutMode === "visual" ? visualPanels : classicPanels),
  ];
}

export default function AppearanceEditorNavigation({
  layoutMode,
  activePanel,
  onSelect,
}: {
  layoutMode: ProfileLayoutMode;
  activePanel: AppearancePanel;
  onSelect: (panel: AppearancePanel) => void;
}) {
  const panels = getAppearancePanels(layoutMode);
  const groups = Array.from(new Set(panels.map((panel) => panel.group)));

  return (
    <nav
      aria-label="Appearance settings"
      className="rounded-2xl border border-zinc-200 bg-white p-2"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:block lg:space-y-3">
        {groups.map((group) => (
          <div key={group} className="contents lg:block lg:space-y-1">
            <p className="hidden px-2 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 lg:block">
              {group}
            </p>
            {panels
              .filter((panel) => panel.group === group)
              .map((panel) => {
                const Icon = panel.icon;
                const selected = panel.id === activePanel;

                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => onSelect(panel.id)}
                    aria-current={selected ? "page" : undefined}
                    className={cx(
                      "inline-flex min-h-10 min-w-0 items-center justify-start gap-2 rounded-xl px-2.5 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/25 sm:px-3 sm:text-sm lg:flex lg:w-full",
                      selected
                        ? "bg-brand-violet-strong text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                    )}
                  >
                    <Icon size={15} aria-hidden="true" className="shrink-0" />
                    <span className="min-w-0 truncate">{panel.label}</span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </nav>
  );
}
