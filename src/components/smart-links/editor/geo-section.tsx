"use client";

import { Plus, Trash2 } from "lucide-react";

import { DestinationPicker } from "@/components/destinations/destination-picker";
import type { GeoRule, SmartLinkEditableData } from "@/types/smart-link";

import { EditorPanel, Field, inputClass, ToggleRow } from "./editor-primitives";
import { actionFromType, emptyDestination, parseCountryCodes } from "./editor-utils";
import type { SmartLinkChangeHandler } from "./types";

export function GeoSection({
  draft,
  change,
}: {
  draft: SmartLinkEditableData;
  change: SmartLinkChangeHandler;
}) {
  const geo = draft.geo;
  const updateGeo = (patch: Partial<typeof geo>) => change({ geo: { ...geo, ...patch } });

  function updateRule(id: string, next: GeoRule) {
    updateGeo({ rules: geo.rules.map((rule) => rule.id === id ? next : rule) });
  }

  return (
    <EditorPanel
      eyebrow="Location routing"
      title="Geo rules"
      description="Route visitors by server-derived country. Browser GPS permission is not used. Every configuration keeps an explicit fallback."
    >
      <ToggleRow
        label="Enable Geo Filter"
        description="Evaluate country rules before the normal link destination."
        checked={geo.enabled}
        onChange={(enabled) => updateGeo({ enabled })}
      />

      <div className="space-y-3">
        {geo.rules.map((rule, index) => (
          <div key={rule.id} className="rounded-2xl border border-zinc-200 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-zinc-950">Rule {index + 1}</p>
                <p className="mt-1 text-xs text-zinc-500">Use two-letter ISO country codes, separated by commas.</p>
              </div>
              <button
                type="button"
                onClick={() => updateGeo({ rules: geo.rules.filter((item) => item.id !== rule.id) })}
                className="rounded-xl p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete geo rule ${index + 1}`}
              >
                <Trash2 size={17} />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Countries">
                <input
                  value={rule.countries.join(", ")}
                  onChange={(event) => updateRule(rule.id, {
                    ...rule,
                    countries: parseCountryCodes(event.target.value),
                  })}
                  placeholder="RS, US, GB"
                  className={inputClass}
                />
              </Field>
              <Field label="Action">
                <select
                  value={rule.action.type}
                  onChange={(event) => updateRule(rule.id, {
                    ...rule,
                    action: actionFromType(event.target.value, rule.action),
                  })}
                  className={inputClass}
                >
                  <option value="REDIRECT">Redirect</option>
                  <option value="DEFAULT_PAGE">Default page</option>
                  <option value="BLOCK">Block</option>
                </select>
              </Field>
            </div>

            {rule.action.type === "REDIRECT" && (
              <DestinationPicker
                value={rule.action.destination}
                onChange={(destination) => updateRule(rule.id, {
                  ...rule,
                  action: { type: "REDIRECT", destination },
                })}
                title="Rule destination"
                compact
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => updateGeo({
          rules: [
            ...geo.rules,
            {
              id: crypto.randomUUID(),
              countries: ["RS"],
              action: { type: "REDIRECT", destination: emptyDestination() },
            },
          ],
        })}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-violet/30 bg-brand-violet-soft px-4 text-sm font-bold text-brand-violet-strong hover:border-brand-violet/60"
      >
        <Plus size={16} /> Add country rule
      </button>

      <div className="rounded-2xl bg-zinc-50 p-4 sm:p-5">
        <p className="text-sm font-black text-zinc-950">Fallback / Everywhere else</p>
        <div className="mt-3">
          <Field label="Fallback action">
            <select
              value={geo.fallback.type}
              onChange={(event) => updateGeo({ fallback: actionFromType(event.target.value, geo.fallback) })}
              className={inputClass}
            >
              <option value="DEFAULT_PAGE">Default page / destination</option>
              <option value="REDIRECT">Redirect elsewhere</option>
              <option value="BLOCK">Block</option>
            </select>
          </Field>
        </div>
        {geo.fallback.type === "REDIRECT" && (
          <DestinationPicker
            value={geo.fallback.destination}
            onChange={(destination) => updateGeo({ fallback: { type: "REDIRECT", destination } })}
            title="Fallback destination"
            compact
          />
        )}
      </div>
    </EditorPanel>
  );
}
