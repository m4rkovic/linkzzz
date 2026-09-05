"use client";

import type { SmartLinkEditableData } from "@/types/smart-link";

import { EditorPanel, Field, inputClass, ToggleRow } from "./editor-primitives";
import type { SmartLinkChangeHandler } from "./types";

export function ShieldSection({
  draft,
  change,
}: {
  draft: SmartLinkEditableData;
  change: SmartLinkChangeHandler;
}) {
  const shield = draft.shield;
  const update = (patch: Partial<typeof shield>) => change({ shield: { ...shield, ...patch } });
  return (
    <EditorPanel
      eyebrow="Automated traffic"
      title="Traffic Shield"
      description="Keep crawler and bot policy attached to this Smart Link. Detection remains server-side."
    >
      <ToggleRow
        label="Traffic Shield"
        description="Enable automated-traffic handling for this Smart Link."
        checked={shield.enabled}
        onChange={(enabled) => update({ enabled })}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Mode">
          <select
            value={shield.mode}
            onChange={(event) => update({ mode: event.target.value as typeof shield.mode })}
            className={inputClass}
            disabled={!shield.enabled}
          >
            <option value="STANDARD">Standard — preview unknown traffic</option>
            <option value="STRICT">Strict — block unknown traffic</option>
          </select>
        </Field>
        <Field label="Verified crawler policy">
          <select
            value={shield.verifiedCrawlerPolicy}
            onChange={(event) => update({ verifiedCrawlerPolicy: event.target.value as typeof shield.verifiedCrawlerPolicy })}
            className={inputClass}
            disabled={!shield.enabled}
          >
            <option value="ALLOW">Allow</option>
            <option value="PREVIEW">Preview only</option>
            <option value="BLOCK">Block</option>
          </select>
        </Field>
      </div>
    </EditorPanel>
  );
}
