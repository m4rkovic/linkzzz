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
      <nav className="space-y-4" aria-label="Smart Link sections">
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
    <nav className="flex min-w-0 gap-2 overflow-x-auto pb-2" aria-label="Smart Link sections">
      {sections.map(({ id, label, icon: Icon }, index) => (
        <div key={id} className="flex shrink-0 items-center gap-2">
          {index > 0 && sections[index - 1]?.group !== sections[index]?.group && (
            <span aria-hidden="true" className="h-6 w-px bg-zinc-200" />
          )}
          <button
            type="button"
            onClick={() => onSelect(id)}
            aria-current={activeSection === id ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
              activeSection === id
                ? "bg-brand-violet-strong text-white shadow-lg shadow-brand-violet/15"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        </div>
      ))}
    </nav>
  );
}
