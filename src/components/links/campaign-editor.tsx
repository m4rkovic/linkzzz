"use client";

import { useState } from "react";
import { CalendarClock, Check, Megaphone, Pin, Save, Sparkles } from "lucide-react";

import ColorPicker from "@/components/ui/color-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, INPUT_CLASS, SegmentedControl, SelectField, ToggleRow } from "@/components/ui/editor-controls";
import { resolveCampaignState } from "@/features/engagement/profile-engagement";
import { useProfile } from "@/features/profile/profile-context";
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
  validateScheduleWindow,
} from "@/features/scheduling/schedule";
import { useScheduleClock } from "@/features/scheduling/use-schedule-clock";
import type { LinkFocusEffect, ProfileCampaign, ProfileEngagement } from "@/types/profile";

const DEFAULT_CAMPAIGN: ProfileCampaign = {
  enabled: false,
  pinPrimary: true,
  focusEffect: "glow",
  dimSiblings: true,
  focusColor: "#8e7dff",
};

export default function CampaignEditor() {
  const { profile, setProfile, saveProfile, saving, dirty } = useProfile();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const engagement: ProfileEngagement = profile.engagement ?? {};
  const campaign = { ...DEFAULT_CAMPAIGN, ...(engagement.campaign ?? {}) };
  const clockEnabled = Boolean(campaign.enabled && (campaign.visibleFrom || campaign.visibleUntil));
  const nowMs = useScheduleClock(clockEnabled);
  const campaignState = resolveCampaignState({ campaign }, nowMs);
  const linkOptions = [
    { value: "", label: "None" },
    ...profile.links.map((link) => ({
      value: link.id,
      label: `${link.title}${link.visible ? "" : " · hidden"}`,
    })),
  ];

  function updateEngagement(values: Partial<ProfileEngagement>) {
    setSaved(false);
    setError("");
    setProfile((current) => ({
      ...current,
      engagement: {
        ...(current.engagement ?? {}),
        ...values,
      },
    }));
  }

  function updateCampaign(values: Partial<ProfileCampaign>) {
    updateEngagement({
      campaign: {
        ...DEFAULT_CAMPAIGN,
        ...(profile.engagement?.campaign ?? {}),
        ...values,
      },
    });
  }

  async function save() {
    if (campaign.enabled && !campaign.primaryLinkId) {
      setError("Choose a primary link before enabling Campaign mode.");
      return;
    }
    const scheduleError = validateScheduleWindow(campaign);
    if (scheduleError) {
      setError(scheduleError);
      return;
    }

    setError("");
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
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong">
              <Megaphone size={17} />
            </span>
            <div>
              <h2 className="text-base font-bold text-zinc-950">Featured & campaign</h2>
              <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                Pin one evergreen CTA, or temporarily override it with a scheduled campaign.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex min-h-6 items-center justify-between gap-3 sm:justify-end">
            <span aria-live="polite" className={`text-xs font-semibold ${error ? "text-red-700" : saved ? "text-emerald-700" : dirty ? "text-amber-700" : "text-zinc-500"}`}>
              {error ? "Check the error below" : saved ? "Changes saved" : dirty ? "Unsaved changes" : "All changes saved"}
            </span>
            {campaign.enabled && <CampaignStateBadge state={campaignState} />}
          </div>
          <Button variant="accent" onClick={() => void save()} disabled={saving || !dirty} className="w-full sm:w-auto">
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? "Saving…" : saved ? "Saved" : "Save engagement"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Pin size={16} className="text-zinc-500" />
            <p className="text-sm font-bold text-zinc-900">Featured link</p>
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Keeps this link first on the public page without changing your saved drag-and-drop order.
          </p>
          <div className="mt-4">
            <SelectField
              label="Pinned CTA"
              value={engagement.featuredLinkId ?? ""}
              options={linkOptions}
              onChange={(featuredLinkId) => updateEngagement({ featuredLinkId: featuredLinkId || undefined })}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <ToggleRow
            label="Campaign mode"
            description="Temporarily promote a primary link during a scheduled campaign window."
            checked={campaign.enabled}
            onChange={(enabled) => updateCampaign({ enabled })}
          />

          {campaign.enabled && (
            <div className="mt-5 space-y-5">
              <SelectField
                label="Primary campaign link"
                value={campaign.primaryLinkId ?? ""}
                options={linkOptions}
                onChange={(primaryLinkId) => updateCampaign({ primaryLinkId: primaryLinkId || undefined })}
              />

              <ToggleRow
                label="Pin campaign link first"
                description="While the campaign is active, its primary link temporarily takes the first position."
                checked={campaign.pinPrimary ?? true}
                onChange={(pinPrimary) => updateCampaign({ pinPrimary })}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Starts" htmlFor="campaign-visible-from" optional>
                  <input
                    id="campaign-visible-from"
                    type="datetime-local"
                    value={toDateTimeLocalValue(campaign.visibleFrom)}
                    onChange={(event) => updateCampaign({ visibleFrom: fromDateTimeLocalValue(event.target.value) })}
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Ends" htmlFor="campaign-visible-until" optional>
                  <input
                    id="campaign-visible-until"
                    type="datetime-local"
                    value={toDateTimeLocalValue(campaign.visibleUntil)}
                    onChange={(event) => updateCampaign({ visibleUntil: fromDateTimeLocalValue(event.target.value) })}
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4 text-xs leading-5 text-zinc-500">
                <CalendarClock size={14} className="mr-1.5 inline" />
                Empty dates mean the campaign starts immediately or continues without an automatic end.
              </div>

              <SegmentedControl
                label="Campaign focus effect"
                value={campaign.focusEffect ?? "glow"}
                options={[
                  { value: "none", label: "Off" },
                  { value: "glow", label: "Glow" },
                  { value: "shake", label: "Shake" },
                  { value: "glow-shake", label: "Both" },
                ]}
                onChange={(focusEffect) => updateCampaign({ focusEffect: focusEffect as LinkFocusEffect })}
              />

              {(campaign.focusEffect ?? "glow") !== "none" && (
                <>
                  <ToggleRow
                    label="Dim other links"
                    description="Reduce surrounding link opacity while the campaign CTA is emphasized."
                    checked={campaign.dimSiblings ?? true}
                    onChange={(dimSiblings) => updateCampaign({ dimSiblings })}
                  />
                  <ColorPicker
                    label="Campaign highlight color"
                    value={campaign.focusColor ?? "#8e7dff"}
                    onChange={(focusColor) => updateCampaign({ focusColor })}
                  />
                </>
              )}
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
        Campaign settings use the same scheduling clock as timed cards and blocks.
      </p>
    </section>
  );
}

function CampaignStateBadge({ state }: { state: ReturnType<typeof resolveCampaignState> }) {
  if (state === "ACTIVE") return <Badge tone="success"><Sparkles size={11} className="mr-1" />Live</Badge>;
  if (state === "UPCOMING") return <Badge tone="accent">Scheduled</Badge>;
  if (state === "ENDED") return <Badge tone="neutral">Ended</Badge>;
  return <Badge tone="neutral">Off</Badge>;
}
