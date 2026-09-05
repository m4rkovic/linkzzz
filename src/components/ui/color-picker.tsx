"use client";

import { useId, useState } from "react";

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const textInputId = useId();

  const displayedValue = draft ?? value;
  const safeColor = normalizeHexColor(value) ?? "#000000";

  function handleNativeColorChange(next: string) {
    const normalized = normalizeHexColor(next);
    if (!normalized) return;

    setDraft(null);
    onChange(normalized);
  }

  function handleTextChange(next: string) {
    setDraft(next);

    const normalized = normalizeHexColor(next);
    if (normalized) onChange(normalized);
  }

  function finishEditing() {
    if (draft === null) return;

    const normalized = normalizeHexColor(draft);

    setDraft(null);

    if (normalized) {
      onChange(normalized);
    }
  }

  return (
    <div>
      <label htmlFor={textInputId} className="text-xs font-semibold text-zinc-600">{label}</label>

      <div className="mt-2 flex min-h-11 overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-300 focus-within:border-brand-violet focus-within:ring-4 focus-within:ring-brand-violet/10">
        <label className="relative flex w-14 shrink-0 cursor-pointer items-center justify-center border-r border-zinc-200">
          <span
            aria-hidden="true"
            className="h-7 w-7 rounded-lg border border-black/10 shadow-sm"
            style={{ backgroundColor: safeColor }}
          />

          <input
            type="color"
            value={safeColor}
            onChange={(event) => handleNativeColorChange(event.target.value)}
            aria-label={`${label} color picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        <input
          id={textInputId}
          type="text"
          value={displayedValue}
          onFocus={() => setDraft(value)}
          onChange={(event) => handleTextChange(event.target.value)}
          onBlur={finishEditing}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }

            if (event.key === "Escape") {
              setDraft(null);
              event.currentTarget.blur();
            }
          }}
          placeholder="#000000"
          spellCheck={false}
          maxLength={7}
          className="min-w-0 flex-1 px-3 font-mono text-sm uppercase text-zinc-900 outline-none"
        />
      </div>
    </div>
  );
}

function normalizeHexColor(input: string) {
  let value = input.trim().toUpperCase();

  if (!value) return null;
  if (!value.startsWith("#")) value = `#${value}`;

  const shortMatch = /^#([0-9A-F]{3})$/.exec(value);

  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  if (/^#[0-9A-F]{6}$/.test(value)) return value;

  return null;
}
