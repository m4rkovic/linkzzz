"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { ProviderIcon } from "@/components/destinations/provider-icon";
import {
  DESTINATION_PROVIDER_CATEGORIES,
  DESTINATION_PROVIDERS,
  getDestinationProvider,
  isDestinationProviderId,
  listDestinationProviders,
  normalizeProviderDestination,
  providerInputFromUrl,
  type DestinationProviderCategory,
  type DestinationProviderId,
} from "@/features/destinations/provider-registry";
import type { DestinationConfig } from "@/types/smart-link";

const INPUT_CLASS = "min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950";

export function DestinationPicker({
  value,
  onChange,
  title = "Destination",
  compact = false,
  showFallback = true,
  showLabel = true,
}: {
  value: DestinationConfig;
  onChange: (value: DestinationConfig) => void;
  title?: string;
  compact?: boolean;
  showFallback?: boolean;
  showLabel?: boolean;
}) {
  const providerId = isDestinationProviderId(value.provider)
    ? value.provider.trim().toUpperCase() as DestinationProviderId
    : "CUSTOM";
  const provider = getDestinationProvider(providerId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const synchronizedInput = value.value || providerInputFromUrl(providerId, value.url);
  const synchronizationKey = `${providerId}\u0000${value.url}\u0000${value.value ?? ""}`;
  const [inputDraft, setInputDraft] = useState(() => ({
    key: synchronizationKey,
    value: synchronizedInput,
  }));
  const localInput = inputDraft.key === synchronizationKey
    ? inputDraft.value
    : synchronizedInput;
  const [inputError, setInputError] = useState("");

  function setLocalInput(input: string) {
    setInputDraft({ key: synchronizationKey, value: input });
  }

  function selectProvider(nextProvider: DestinationProviderId) {
    setLocalInput("");
    setInputError("");
    onChange({
      provider: nextProvider,
      value: "",
      url: "",
      ...(value.fallbackUrl ? { fallbackUrl: value.fallbackUrl } : {}),
      ...(value.deeplinkOverrides ? { deeplinkOverrides: value.deeplinkOverrides } : {}),
    });
    setPickerOpen(false);
  }

  function updateInput(input: string) {
    setLocalInput(input);
    setInputError("");
    if (!input.trim()) {
      onChange({ ...value, provider: providerId, value: "", url: "" });
      return;
    }
    const normalized = normalizeProviderDestination(providerId, input);
    if (!normalized.ok) {
      onChange({ ...value, provider: providerId, value: input, url: "" });
      return;
    }
    onChange({
      ...value,
      provider: providerId,
      value: normalized.value.value,
      url: normalized.value.url,
    });
  }

  function validateInput() {
    if (!localInput.trim()) return;
    const normalized = normalizeProviderDestination(providerId, localInput);
    if (!normalized.ok) {
      setInputError(normalized.error);
      return;
    }
    setInputError("");
    onChange({
      ...value,
      provider: providerId,
      value: normalized.value.value,
      url: normalized.value.url,
    });
  }

  return (
    <div className={`${compact ? "mt-4" : "mt-1"} rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <ProviderIcon provider={providerId} size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-zinc-950">{title}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{provider.name} · {provider.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-black text-zinc-700 transition hover:bg-zinc-50"
        >
          Change provider <ChevronDown size={15} />
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label={provider.inputLabel}>
          <input
            value={localInput}
            onChange={(event) => updateInput(event.target.value)}
            onBlur={validateInput}
            placeholder={provider.placeholder}
            className={INPUT_CLASS}
            autoComplete="off"
          />
          {inputError && <p className="mt-1.5 text-xs font-semibold text-red-600">{inputError}</p>}
        </Field>
        <Field label="Normalized destination" hint="Generated automatically from the provider input.">
          <div className="flex min-h-11 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600">
            <span className="min-w-0 break-all">{value.url || "Waiting for a valid destination…"}</span>
          </div>
        </Field>
      </div>

      {showLabel && (
        <Field label="Display label" hint="Optional. Useful when the same provider appears more than once.">
          <input
            value={value.label ?? ""}
            onChange={(event) => onChange({ ...value, label: event.target.value || undefined })}
            placeholder={provider.name}
            className={INPUT_CLASS}
            maxLength={100}
          />
        </Field>
      )}

      {showFallback && (
        <Field label="HTTPS fallback" hint="Optional web fallback if an app/deeplink attempt cannot be completed.">
          <input
            value={value.fallbackUrl ?? ""}
            onChange={(event) => onChange({ ...value, fallbackUrl: event.target.value || undefined })}
            placeholder="https://..."
            className={INPUT_CLASS}
          />
        </Field>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-black ${provider.supportsDeeplink ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
          {provider.supportsDeeplink ? "Deeplink capable" : "Web destination"}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-black text-zinc-500">{provider.category}</span>
      </div>

      {pickerOpen && <ProviderLibraryModal selected={providerId} onSelect={selectProvider} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

function ProviderLibraryModal({
  selected,
  onSelect,
  onClose,
}: {
  selected: DestinationProviderId;
  onSelect: (provider: DestinationProviderId) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DestinationProviderCategory>("Popular");

  const providers = useMemo(() => {
    const base = query.trim() ? DESTINATION_PROVIDERS : listDestinationProviders(category);
    const needle = query.trim().toLowerCase();
    if (!needle) return base;
    return base.filter((provider) =>
      `${provider.name} ${provider.id} ${provider.category} ${provider.description}`.toLowerCase().includes(needle),
    );
  }, [category, query]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Choose destination provider">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close provider picker" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Destination library</p>
            <h3 className="mt-1 text-xl font-black text-zinc-950">Choose a provider</h3>
            <p className="mt-1 text-sm text-zinc-500">Pick the service. Linkzzz handles the boring URL syntax.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-zinc-100 p-4 sm:p-5">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Instagram, Spotify, email…"
              className="min-h-11 w-full rounded-xl border border-zinc-200 pl-10 pr-3 text-sm outline-none focus:border-zinc-950"
              autoFocus
            />
          </div>
          {!query.trim() && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {DESTINATION_PROVIDER_CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`min-h-9 shrink-0 rounded-xl px-3 text-xs font-black transition ${category === item ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {providers.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => {
                const active = provider.id === selected;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => onSelect(provider.id)}
                    className={`flex min-h-[92px] items-start gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-400 hover:bg-zinc-50"}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/10" : "bg-zinc-100"}`}>
                      <ProviderIcon provider={provider.id} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-black">
                        {provider.name} {active && <Check size={14} />}
                      </span>
                      <span className={`mt-1 block text-xs leading-4 ${active ? "text-zinc-300" : "text-zinc-500"}`}>{provider.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-500">No provider matches that search.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-bold text-zinc-800">
      {label}
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1.5 block text-xs font-normal leading-5 text-zinc-400">{hint}</span>}
    </label>
  );
}
