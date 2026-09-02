"use client";

import type { SmartLinkEditableData } from "@/types/smart-link";

import { EditorPanel, Field, inputClass, ToggleRow } from "./editor-primitives";
import type { SmartLinkChangeHandler } from "./types";

export function DeeplinkSection({
  draft,
  change,
}: {
  draft: SmartLinkEditableData;
  change: SmartLinkChangeHandler;
}) {
  const config = draft.deeplink;
  const update = (patch: Partial<typeof config>) => change({ deeplink: { ...config, ...patch } });

  return (
    <EditorPanel
      eyebrow="Redirect behavior"
      title="Smart Deeplink"
      description="Configure how Linkzzz attempts to leave restrictive in-app browsers and reach the intended app or normal browser destination."
    >
      <ToggleRow
        label="Smart Deeplink"
        description="Use platform-aware redirect behavior before falling back to the normal HTTPS URL."
        checked={config.enabled}
        onChange={(enabled) => update({ enabled })}
      />

      <Field label="Strategy">
        <select
          value={config.strategy}
          onChange={(event) => update({ strategy: event.target.value as typeof config.strategy })}
          className={inputClass}
          disabled={!config.enabled}
        >
          <option value="SMART">Smart redirect</option>
          <option value="STANDARD_REDIRECT">Standard redirect</option>
          <option value="EXTERNAL_BROWSER_HELPER">External browser helper</option>
        </select>
      </Field>

      <div className="grid gap-3 md:grid-cols-2">
        <ToggleRow
          label="Open in browser helper"
          description="Show guidance when an in-app browser blocks the preferred behavior."
          checked={config.openInBrowserHelper}
          onChange={(openInBrowserHelper) => update({ openInBrowserHelper })}
          compact
        />
        <ToggleRow
          label="Long-press helper"
          description="Optional fallback guidance for destinations where long-press improves compatibility."
          checked={config.longPressHelper}
          onChange={(longPressHelper) => update({ longPressHelper })}
          compact
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(["android", "ios"] as const).map((platform) => {
          const current = config[platform] ?? { enabled: true };
          return (
            <div key={platform} className="rounded-2xl border border-zinc-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black capitalize text-zinc-950">{platform}</p>
                  <p className="mt-1 text-xs text-zinc-500">Provider defaults are used when custom URI is blank.</p>
                </div>
                <input
                  type="checkbox"
                  checked={current.enabled}
                  onChange={(event) => update({ [platform]: { ...current, enabled: event.target.checked } })}
                  className="h-5 w-5"
                />
              </div>
              <Field label="Custom URI" hint="Example: spotify://... or intent://...">
                <input
                  value={current.customUri ?? ""}
                  onChange={(event) => update({ [platform]: { ...current, customUri: event.target.value || undefined } })}
                  placeholder={platform === "android" ? "intent://..." : "spotify://..."}
                  className={inputClass}
                  disabled={!current.enabled}
                />
              </Field>
            </div>
          );
        })}
      </div>
    </EditorPanel>
  );
}
