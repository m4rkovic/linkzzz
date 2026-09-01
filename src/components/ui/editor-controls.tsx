"use client";

import type { ReactNode } from "react";

export const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400";

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
        {optional && <span className="text-[10px] text-zinc-400">Optional</span>}
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
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-zinc-800">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-zinc-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-zinc-950" : "bg-zinc-200"}`}
      >
        <span
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
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-zinc-800">{label}</label>
        <span className="text-xs font-bold text-zinc-500">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-zinc-950"
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
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
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
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-600">{label}</label>
      <div className="mt-2 grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-zinc-100 p-1">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition ${selected ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
