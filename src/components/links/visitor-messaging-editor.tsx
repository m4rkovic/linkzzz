"use client";

import { Check, MessageCircleMore, Save, Signal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, INPUT_CLASS, SegmentedControl } from "@/components/ui/editor-controls";
import { resolveVisitorMessaging } from "@/features/engagement/visitor-messaging";
import { useProfile } from "@/features/profile/profile-context";
import type {
  ProfileActiveIndicatorMode,
  ProfileResponseTimeMode,
  ProfileVisitorMessaging,
} from "@/types/profile";

export default function VisitorMessagingEditor() {
  const { profile, setProfile, saveProfile, saving, dirty } = useProfile();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const messaging = resolveVisitorMessaging(profile.engagement);

  function update(values: Partial<ProfileVisitorMessaging>) {
    setSaved(false);
    setError("");
    setProfile((current) => ({
      ...current,
      engagement: {
        ...(current.engagement ?? {}),
        visitorMessaging: {
          ...resolveVisitorMessaging(current.engagement),
          ...values,
        },
      },
    }));
  }

  async function save() {
    if (messaging.responseTime === "CUSTOM") {
      const value = messaging.customResponseTime.trim();
      if (!value) {
        setError("Enter the custom response-time text.");
        return;
      }
      if (value.length > 80) {
        setError("Custom response-time text cannot exceed 80 characters.");
        return;
      }
    }

    const result = await saveProfile();
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime-soft text-zinc-950">
            <MessageCircleMore size={17} />
          </span>
          <div>
            <h2 className="text-base font-bold text-zinc-950">Visitor messaging</h2>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500">
              Add lightweight availability cues without implying real-time presence.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <span aria-live="polite" className={`text-xs font-semibold ${error ? "text-red-700" : saved ? "text-emerald-700" : dirty ? "text-amber-700" : "text-zinc-500"}`}>
            {error ? "Check the error below" : saved ? "Changes saved" : dirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <Button variant="accent" onClick={() => void save()} disabled={saving || !dirty} className="w-full sm:w-auto">
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? "Saving…" : saved ? "Saved" : "Save messaging"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Signal size={16} className="text-zinc-500" />
            <p className="text-sm font-bold text-zinc-900">Active indicator</p>
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            This is a static presentation label. It does not indicate live presence or realtime availability.
          </p>
          <div className="mt-4">
            <SegmentedControl
              label="Indicator"
              value={messaging.activeIndicator}
              options={[
                { value: "OFF", label: "Off" },
                { value: "STATIC_ACTIVE", label: "Active" },
              ]}
              onChange={(activeIndicator) =>
                update({ activeIndicator: activeIndicator as ProfileActiveIndicatorMode })
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <p className="text-sm font-bold text-zinc-900">Response time</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Show an expectation you explicitly set, rather than deriving one from visitor activity.
          </p>
          <div className="mt-4">
            <SegmentedControl
              label="Response label"
              value={messaging.responseTime}
              options={[
                { value: "OFF", label: "Off" },
                { value: "TEN_MINUTES", label: "10 min" },
                { value: "ONE_HOUR", label: "1 hour" },
                { value: "CUSTOM", label: "Custom" },
              ]}
              onChange={(responseTime) =>
                update({ responseTime: responseTime as ProfileResponseTimeMode })
              }
            />
          </div>

          {messaging.responseTime === "CUSTOM" && (
            <div className="mt-4">
              <Field label="Custom text" htmlFor="response-time-custom">
                <input
                  id="response-time-custom"
                  className={INPUT_CLASS}
                  value={messaging.customResponseTime}
                  maxLength={80}
                  placeholder="Usually replies the same day"
                  onChange={(event) => update({ customResponseTime: event.target.value })}
                />
              </Field>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <p className="mt-5 border-t border-zinc-100 pt-5 text-xs text-zinc-400">
        These labels appear near the public profile identity.
      </p>
    </section>
  );
}
