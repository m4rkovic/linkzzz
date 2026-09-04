"use client";

import type { EditorSection, SectionDefinition } from "./types";

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
              <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{group}</p>
              <div className="space-y-1">
                {groupSections.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelect(id)}
                    aria-current={activeSection === id ? "page" : undefined}
                    className={`inline-flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
                      activeSection === id
                        ? "bg-brand-violet-strong text-white shadow-lg shadow-brand-violet/15"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
                  >
                    <Icon size={16} />
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
      className="grid min-w-0 grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-white p-2 sm:grid-cols-3"
      aria-label="Smart Link sections"
      data-editor-navigation="compact"
    >
      {sections.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-current={activeSection === id ? "page" : undefined}
          className={`inline-flex min-h-10 min-w-0 items-center justify-start gap-2 rounded-xl px-2.5 text-left text-xs font-bold transition sm:px-3 sm:text-sm ${
            activeSection === id
              ? "bg-brand-violet-strong text-white shadow-lg shadow-brand-violet/15"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
          }`}
        >
          <Icon size={16} className="shrink-0" />
          <span className="min-w-0 truncate">{label}</span>
        </button>
      ))}
    </nav>
  );
}
