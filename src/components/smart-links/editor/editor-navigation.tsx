"use client";

import type { EditorSection, SectionDefinition } from "./types";

const NAV_BUTTON_FOCUS = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/25";

export function EditorNavigation({
  sections,
  activeSection,
  onSelect,
  vertical = false,
}: {
  sections: SectionDefinition[];
  activeSection: EditorSection;
  onSelect: (section: EditorSection) => void;
  vertical?: boolean;
}) {
  if (vertical) {
    const groups = ["Essential", "Advanced"] as const;
    return (
      <nav className="space-y-4" aria-label="Smart Link sections" data-editor-navigation="sidebar">
        {groups.map((group) => {
          const groupSections = sections.filter((section) => section.group === group);
          if (!groupSections.length) return null;
          return (
            <div key={group}>
              <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{group}</p>
              <div className="space-y-1">
                {groupSections.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelect(id)}
                    aria-current={activeSection === id ? "page" : undefined}
                    className={`inline-flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${NAV_BUTTON_FOCUS} ${
                      activeSection === id
                        ? "bg-brand-violet-strong text-white shadow-lg shadow-brand-violet/15"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className="grid min-w-0 grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-white p-2 sm:grid-cols-3 md:flex md:items-center md:border-0 md:bg-transparent md:p-0 md:pb-2"
      aria-label="Smart Link sections"
      data-editor-navigation="compact"
    >
      {sections.map(({ id, label, icon: Icon }, index) => (
        <div key={id} className="contents">
          {index > 0 && sections[index - 1]?.group !== sections[index]?.group && (
            <span aria-hidden="true" className="hidden h-6 w-px bg-zinc-200 md:block" />
          )}
          <button
            type="button"
            onClick={() => onSelect(id)}
            aria-current={activeSection === id ? "page" : undefined}
            className={`inline-flex min-h-10 min-w-0 items-center justify-start gap-2 rounded-xl px-2.5 text-left text-xs font-bold transition sm:px-3 sm:text-sm md:w-auto md:shrink-0 ${NAV_BUTTON_FOCUS} ${
              activeSection === id
                ? "bg-brand-violet-strong text-white shadow-lg shadow-brand-violet/15"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <Icon size={16} aria-hidden="true" className="shrink-0" />
            <span className="min-w-0 truncate">{label}</span>
          </button>
        </div>
      ))}
    </nav>
  );
}
