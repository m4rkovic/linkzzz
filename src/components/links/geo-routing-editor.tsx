"use client";

import { Eye, EyeOff, Globe2, Plus, Route, Trash2 } from "lucide-react";

import { DestinationPicker } from "@/components/destinations/destination-picker";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-control";
import {
  LINK_GEO_COUNTRIES,
  createLinkGeoRule,
} from "@/features/links/link-geo";
import type {
  LinkGeoConfig,
  LinkGeoRule,
  LinkGeoRuleAction,
} from "@/types/profile";

export default function GeoRoutingEditor({
  geo,
  onChange,
}: {
  geo: LinkGeoConfig;
  onChange: (geo: LinkGeoConfig) => void;
}) {
  function updateRule(id: string, patch: Partial<LinkGeoRule>) {
    onChange({
      ...geo,
      rules: geo.rules.map((rule) =>
        rule.id === id ? { ...rule, ...patch } : rule,
      ),
    });
  }

  function addRule() {
    const rule = createLinkGeoRule(geo.rules);
    if (!rule) return;
    onChange({ ...geo, rules: [...geo.rules, rule] });
  }

  function changeCountry(id: string, countryCode: string) {
    const country = LINK_GEO_COUNTRIES.find((item) => item.code === countryCode);
    if (!country) return;
    updateRule(id, {
      countryCode: country.code,
      countryName: country.name,
    });
  }

  function changeAction(id: string, action: LinkGeoRuleAction) {
    const rule = geo.rules.find((item) => item.id === id);
    if (!rule) return;
    updateRule(id, {
      action,
      destination:
        action === "REDIRECT"
          ? rule.destination ?? { provider: "CUSTOM", value: "", url: "" }
          : undefined,
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-violet-strong shadow-sm ring-1 ring-zinc-200">
            <Globe2 size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-950">Per-card Geo</p>
            <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-500">
              Show, hide or reroute this card by visitor country. Rules are enforced on the server too, not just in preview.
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-pressed={geo.enabled}
          onClick={() => onChange({ ...geo, enabled: !geo.enabled })}
          className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20 ${
            geo.enabled
              ? "bg-brand-violet-strong text-white"
              : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {geo.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
          {geo.enabled ? "Geo enabled" : "Geo disabled"}
        </button>
      </div>

      {geo.enabled && (
        <div className="mt-5 space-y-4">
          <label className="block rounded-xl border border-zinc-200 bg-white p-4">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Fallback</span>
            <span className="mt-1 block text-sm font-semibold text-zinc-900">Visitors without a matching country rule</span>
            <div className="mt-3 max-w-sm">
              <Select
                value={geo.fallback}
                onChange={(event) =>
                  onChange({
                    ...geo,
                    fallback: event.target.value === "HIDE" ? "HIDE" : "SHOW",
                  })
                }
              >
                <option value="SHOW">Show card with default destination</option>
                <option value="HIDE">Hide card</option>
              </Select>
            </div>
            <span className="mt-2 block text-xs leading-5 text-zinc-400">
              Use Hide as the fallback to make a country whitelist. Add explicit Show rules for the countries that may see the card.
            </span>
          </label>

          <div className="space-y-3">
            {geo.rules.map((rule, index) => (
              <div key={rule.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Country rule {index + 1}</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900">{rule.countryName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove Geo rule ${index + 1}`}
                    onClick={() =>
                      onChange({
                        ...geo,
                        rules: geo.rules.filter((item) => item.id !== rule.id),
                      })
                    }
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-zinc-600">Country</span>
                    <Select
                      value={rule.countryCode}
                      onChange={(event) => changeCountry(rule.id, event.target.value)}
                    >
                      {!LINK_GEO_COUNTRIES.some((country) => country.code === rule.countryCode.toUpperCase()) && (
                        <option value={rule.countryCode}>{rule.countryName}</option>
                      )}
                      {LINK_GEO_COUNTRIES.map((country) => (
                        <option
                          key={country.code}
                          value={country.code}
                          disabled={geo.rules.some(
                            (existing) =>
                              existing.id !== rule.id &&
                              existing.countryCode.toUpperCase() === country.code,
                          )}
                        >
                          {country.name}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-zinc-600">Action</span>
                    <Select
                      value={rule.action}
                      onChange={(event) =>
                        changeAction(rule.id, event.target.value as LinkGeoRuleAction)
                      }
                    >
                      <option value="SHOW">Show default card</option>
                      <option value="HIDE">Hide card</option>
                      <option value="REDIRECT">Use another destination</option>
                    </Select>
                  </label>
                </div>

                {rule.action === "REDIRECT" && (
                  <DestinationPicker
                    value={rule.destination ?? { provider: "CUSTOM", value: "", url: "" }}
                    onChange={(destination) => updateRule(rule.id, { destination })}
                    title={`${rule.countryName} destination`}
                    compact
                    showFallback={false}
                    showLabel={false}
                  />
                )}

                {rule.action !== "REDIRECT" && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-xs leading-5 text-zinc-500">
                    {rule.action === "HIDE" ? <EyeOff size={14} className="mt-0.5 shrink-0" /> : <Eye size={14} className="mt-0.5 shrink-0" />}
                    {rule.action === "HIDE"
                      ? "Visitors from this country will not receive this card at all. Direct outbound access is rejected too."
                      : "Visitors from this country see the card and use its normal destination."}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={addRule}
            disabled={geo.rules.length >= LINK_GEO_COUNTRIES.length}
          >
            <Plus size={16} /> Add country rule
          </Button>

          {geo.rules.length === 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-xs leading-5 text-zinc-500">
              <Route size={15} className="mt-0.5 shrink-0" />
              No country rules yet. The fallback above currently controls every visitor.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
