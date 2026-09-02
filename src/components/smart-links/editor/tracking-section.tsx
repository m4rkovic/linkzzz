"use client";

import type { SmartLinkEditableData } from "@/types/smart-link";

import { EditorPanel, Field, inputClass, ToggleRow } from "./editor-primitives";
import type { SmartLinkChangeHandler } from "./types";

export function TrackingSection({
  draft,
  change,
}: {
  draft: SmartLinkEditableData;
  change: SmartLinkChangeHandler;
}) {
  const tracking = draft.tracking;
  const update = (patch: Partial<typeof tracking>) => change({ tracking: { ...tracking, ...patch } });
  return (
    <EditorPanel
      eyebrow="Measurement"
      title="Tracking"
      description="Keep Linkzzz analytics and external measurement IDs scoped to this Smart Link."
    >
      <ToggleRow
        label="Linkzzz Analytics"
        description="Store internal link views, clicks and redirect events."
        checked={tracking.internalAnalytics}
        onChange={(internalAnalytics) => update({ internalAnalytics })}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="GA4 Measurement ID" hint="Rendered pages/helpers. Example: G-XXXXXXXXXX">
          <input
            value={tracking.ga4MeasurementId ?? ""}
            onChange={(event) => update({ ga4MeasurementId: event.target.value || undefined })}
            placeholder="G-XXXXXXXXXX"
            className={inputClass}
          />
        </Field>
        <Field label="Meta Pixel ID" hint="Rendered pages/helpers. Digits only.">
          <input
            value={tracking.metaPixelId ?? ""}
            onChange={(event) => update({ metaPixelId: event.target.value || undefined })}
            inputMode="numeric"
            placeholder="123456789012345"
            className={inputClass}
          />
        </Field>
      </div>
    </EditorPanel>
  );
}
