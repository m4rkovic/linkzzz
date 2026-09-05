"use client";

import { useId, type KeyboardEvent, type ReactNode } from "react";

export const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/10";

type Option = {
  value: string;
  label: string;
};

export function Field({
  label,
  htmlFor,
  optional = false,
  children,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-semibold text-zinc-600">{label}</label>
        {optional && <span className="text-[10px] font-medium text-zinc-500">Optional</span>}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-semibold text-zinc-800">{label}</p>
        <p id={descriptionId} className="mt-0.5 text-xs leading-5 text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20 ${checked ? "bg-zinc-950" : "bg-zinc-300"}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const inputId = useId();

  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-800">{label}</label>
        <span className="text-xs font-bold text-zinc-600" aria-hidden="true">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-valuetext={`${value}${suffix}`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-zinc-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20"
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const selectId = useId();

  return (
    <div>
      <label htmlFor={selectId} className="text-xs font-semibold text-zinc-600">{label}</label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition hover:border-zinc-300 focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const labelId = useId();

  return (
    <div>
      <p id={labelId} className="text-xs font-semibold text-zinc-600">{label}</p>
      <div
        className="mt-2 grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-zinc-100 p-1"
        role="radiogroup"
        aria-labelledby={labelId}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleSegmentedKeyDown(event, options, option.value, onChange)}
              className={`min-h-10 min-w-0 rounded-lg px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20 sm:px-3 ${selected ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}
            >
              <span className="block truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function handleSegmentedKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  options: Option[],
  currentValue: string,
  onChange: (value: string) => void,
) {
  const currentIndex = options.findIndex((option) => option.value === currentValue);
  if (currentIndex < 0) return;

  let nextIndex: number | undefined;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % options.length;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + options.length) % options.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = options.length - 1;
  if (nextIndex === undefined) return;

  event.preventDefault();
  const nextOption = options[nextIndex];
  if (!nextOption) return;

  onChange(nextOption.value);
  const controls = Array.from(
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [],
  );
  controls[nextIndex]?.focus();
}
