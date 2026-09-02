import { CalendarClock } from "lucide-react";

import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/features/scheduling/schedule";
import type { LinkDraft } from "@/features/links/link-editor-types";
import { EditorSection } from "./link-editor-primitives";

const inputClass =
  "min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-950";

export default function LinkAvailabilitySection({
  draft,
  onChange,
}: {
  draft: LinkDraft;
  onChange: (values: Partial<LinkDraft>) => void;
}) {
  const availability = draft.availability;

  function update(values: Partial<LinkDraft["availability"]>) {
    onChange({ availability: { ...availability, ...values } });
  }

  return (
    <EditorSection
      title="Availability & expiry"
      description="Schedule when this card appears. After the end time, hide it or leave a disabled card in place."
      icon={CalendarClock}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-bold text-zinc-700">
          <span>Show from</span>
          <input
            type="datetime-local"
            className={inputClass}
            value={toDateTimeLocalValue(availability.visibleFrom)}
            onChange={(event) =>
              update({ visibleFrom: fromDateTimeLocalValue(event.target.value) })
            }
          />
          <span className="text-[11px] font-medium leading-4 text-zinc-400">
            Leave empty to make it available immediately.
          </span>
        </label>

        <label className="grid gap-1.5 text-xs font-bold text-zinc-700">
          <span>Show until</span>
          <input
            type="datetime-local"
            className={inputClass}
            value={toDateTimeLocalValue(availability.visibleUntil)}
            onChange={(event) =>
              update({ visibleUntil: fromDateTimeLocalValue(event.target.value) })
            }
          />
          <span className="text-[11px] font-medium leading-4 text-zinc-400">
            Leave empty to keep the card available indefinitely.
          </span>
        </label>
      </div>

      {availability.visibleUntil && (
        <label className="mt-4 grid gap-1.5 text-xs font-bold text-zinc-700">
          <span>After expiry</span>
          <select
            className={inputClass}
            value={availability.expiryAction ?? "HIDE"}
            onChange={(event) =>
              update({ expiryAction: event.target.value as "HIDE" | "DISABLE" })
            }
          >
            <option value="HIDE">Hide card</option>
            <option value="DISABLE">Keep card visible but disabled</option>
          </select>
        </label>
      )}

      {(availability.visibleFrom || availability.visibleUntil) && (
        <button
          type="button"
          onClick={() => onChange({ availability: { expiryAction: "HIDE" } })}
          className="mt-4 text-xs font-bold text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-950"
        >
          Clear schedule
        </button>
      )}
    </EditorSection>
  );
}
