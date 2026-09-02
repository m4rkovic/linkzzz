import { Badge, Palette, Sparkles } from "lucide-react";
import ColorPicker from "@/components/ui/color-picker";
import {
  Field,
  INPUT_CLASS,
  RangeField,
  SegmentedControl,
  ToggleRow,
} from "@/components/ui/editor-controls";
import type {
  LinkCardBackgroundType,
  LinkCtaStyle,
  LinkFocusEffect,
  LinkPlatformBadgePosition,
  LinkPlatformBadgeStyle,
} from "@/types/profile";
import type { CardStyleDraft, LinkDraft } from "@/features/links/link-editor-types";
import { EditorSection } from "./link-editor-primitives";

export default function LinkCardDesignSection({ draft, onChange }: {
  draft: LinkDraft;
  onChange: (values: Partial<CardStyleDraft>) => void;
}) {
  const style = draft.customStyle;

  function applyPreset(preset: "media" | "poster" | "clean" | "cta") {
    if (preset === "media") {
      onChange({
        enabled: true,
        backgroundType: "image",
        borderRadius: 18,
        borderWidth: 0,
        shadow: 2,
        overlayColor: "#000000",
        overlayOpacity: 0.42,
        platformBadgeStyle: "circle",
        titleSize: 22,
        descriptionSize: 13,
        contentPadding: 18,
        imageScale: 100,
        ctaStyle: "none",
        badgeText: "",
      });
      return;
    }

    if (preset === "poster") {
      onChange({
        enabled: true,
        backgroundType: "image",
        borderRadius: 12,
        borderWidth: 0,
        shadow: 4,
        overlayColor: "#000000",
        overlayOpacity: 0.28,
        platformBadgeStyle: "plain",
        titleSize: 28,
        descriptionSize: 14,
        contentPadding: 22,
        imageScale: 103,
        ctaStyle: "none",
        badgeText: "FEATURED",
        badgeBackgroundColor: "#ffffff",
        badgeTextColor: "#09090b",
      });
      return;
    }

    if (preset === "clean") {
      onChange({
        enabled: true,
        backgroundType: "solid",
        backgroundColor: "#ffffff",
        textColor: "#09090b",
        borderColor: "#e4e4e7",
        borderRadius: 18,
        borderWidth: 1,
        shadow: 1,
        platformBadgeStyle: "plain",
        titleSize: 20,
        descriptionSize: 13,
        descriptionColor: "#52525b",
        contentPadding: 20,
        ctaStyle: "none",
        badgeText: "",
      });
      return;
    }

    onChange({
      enabled: true,
      backgroundType: "image",
      borderRadius: 20,
      borderWidth: 0,
      shadow: 3,
      overlayColor: "#000000",
      overlayOpacity: 0.52,
      platformBadgeStyle: "circle",
      titleSize: 24,
      descriptionSize: 13,
      contentPadding: 20,
      imageScale: 100,
      ctaStyle: "pill",
      ctaText: style.ctaText || "Open link",
      ctaBackgroundColor: "#ffffff",
      ctaTextColor: "#09090b",
    });
  }

  return (
    <>
      {draft.layout !== "button" && (
        <EditorSection title="Card design" description="Build this card independently from the global Appearance settings." icon={Palette}>
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-700">Quick style</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["media", "Media"],
                  ["poster", "Poster"],
                  ["clean", "Clean"],
                  ["cta", "CTA"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => applyPreset(value as "media" | "poster" | "clean" | "cta")}
                    className="min-h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow
              label="Custom styling"
              description="Give this card its own colors, proportions, typography and action treatment."
              checked={style.enabled}
              onChange={(enabled) => onChange({ enabled })}
            />

            {!style.enabled && (
              <div className="rounded-xl bg-zinc-50 p-4 text-xs leading-5 text-zinc-500">
                This card currently inherits its design from Appearance → Cards.
              </div>
            )}

            {style.enabled && (
              <>
                <SegmentedControl
                  label="Background"
                  value={style.backgroundType}
                  options={[
                    { value: "image", label: "Image" },
                    { value: "solid", label: "Solid" },
                    { value: "gradient", label: "Gradient" },
                  ]}
                  onChange={(value) => onChange({ backgroundType: value as LinkCardBackgroundType })}
                />

                {style.backgroundType === "image" && (
                  <>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-5 text-zinc-500">
                      The Media image becomes the full card background. Text, badges and CTA sit above it.
                    </div>
                    <RangeField label="Image zoom" value={style.imageScale} min={100} max={125} step={1} suffix="%" onChange={(imageScale) => onChange({ imageScale })} />
                  </>
                )}

                {style.backgroundType === "solid" && (
                  <ColorPicker label="Background color" value={style.backgroundColor} onChange={(backgroundColor) => onChange({ backgroundColor })} />
                )}

                {style.backgroundType === "gradient" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorPicker label="Gradient start" value={style.gradientFrom} onChange={(gradientFrom) => onChange({ gradientFrom })} />
                    <ColorPicker label="Gradient end" value={style.gradientTo} onChange={(gradientTo) => onChange({ gradientTo })} />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorPicker label="Text color" value={style.textColor} onChange={(textColor) => onChange({ textColor })} />
                  <ColorPicker label="Description color" value={style.descriptionColor} onChange={(descriptionColor) => onChange({ descriptionColor })} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <RangeField label="Title size" value={style.titleSize} min={14} max={42} step={1} suffix="px" onChange={(titleSize) => onChange({ titleSize })} />
                  <RangeField label="Description size" value={style.descriptionSize} min={10} max={20} step={1} suffix="px" onChange={(descriptionSize) => onChange({ descriptionSize })} />
                </div>

                <RangeField label="Content padding" value={style.contentPadding} min={8} max={40} step={1} suffix="px" onChange={(contentPadding) => onChange({ contentPadding })} />
                <RangeField label="Card height" value={style.height} min={120} max={640} step={10} suffix="px" onChange={(height) => onChange({ height })} />
                <RangeField label="Corner radius" value={style.borderRadius} min={0} max={48} step={1} suffix="px" onChange={(borderRadius) => onChange({ borderRadius })} />
                <RangeField label="Border width" value={style.borderWidth} min={0} max={5} step={1} suffix="px" onChange={(borderWidth) => onChange({ borderWidth })} />
                <ColorPicker label="Border color" value={style.borderColor} onChange={(borderColor) => onChange({ borderColor })} />
                <RangeField label="Shadow" value={style.shadow} min={0} max={4} step={1} onChange={(shadow) => onChange({ shadow })} />

                {draft.overlayEnabled && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorPicker label="Overlay color" value={style.overlayColor} onChange={(overlayColor) => onChange({ overlayColor })} />
                    <RangeField label="Overlay opacity" value={Math.round(style.overlayOpacity * 100)} min={0} max={90} step={5} suffix="%" onChange={(value) => onChange({ overlayOpacity: value / 100 })} />
                  </div>
                )}

                {draft.showPlatformIcon && (
                  <div className="space-y-5 rounded-2xl border border-zinc-200 p-4">
                    <SegmentedControl
                      label="Platform badge"
                      value={style.platformBadgeStyle}
                      options={[
                        { value: "circle", label: "Circle" },
                        { value: "plain", label: "Plain" },
                        { value: "none", label: "None" },
                      ]}
                      onChange={(value) => onChange({ platformBadgeStyle: value as LinkPlatformBadgeStyle })}
                    />
                    {style.platformBadgeStyle !== "none" && (
                      <>
                        <SegmentedControl
                          label="Badge position"
                          value={style.platformBadgePosition}
                          options={[
                            { value: "top-left", label: "Top left" },
                            { value: "top-right", label: "Top right" },
                          ]}
                          onChange={(value) => onChange({ platformBadgePosition: value as LinkPlatformBadgePosition })}
                        />
                        {style.platformBadgeStyle === "circle" && (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <ColorPicker label="Badge background" value={style.platformBadgeBackgroundColor} onChange={(platformBadgeBackgroundColor) => onChange({ platformBadgeBackgroundColor })} />
                            <ColorPicker label="Badge icon" value={style.platformBadgeTextColor} onChange={(platformBadgeTextColor) => onChange({ platformBadgeTextColor })} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </EditorSection>
      )}

      {draft.layout !== "button" && (
        <EditorSection title="Badge and CTA" description="Add compact promotional text or an action pill without turning the whole card into a generic button." icon={Badge}>
          <div className="space-y-5">
            <Field label="Badge text" htmlFor="card-badge-text" optional>
              <input
                id="card-badge-text"
                type="text"
                value={style.badgeText}
                maxLength={32}
                onChange={(event) => onChange({ badgeText: event.target.value })}
                placeholder="NEW · FEATURED · 20% OFF"
                className={INPUT_CLASS}
              />
            </Field>

            {style.badgeText && (
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorPicker label="Badge background" value={style.badgeBackgroundColor} onChange={(badgeBackgroundColor) => onChange({ badgeBackgroundColor })} />
                <ColorPicker label="Badge text" value={style.badgeTextColor} onChange={(badgeTextColor) => onChange({ badgeTextColor })} />
              </div>
            )}

            <SegmentedControl
              label="CTA style"
              value={style.ctaStyle}
              options={[
                { value: "none", label: "Off" },
                { value: "pill", label: "Pill" },
                { value: "solid", label: "Solid" },
                { value: "glass", label: "Glass" },
              ]}
              onChange={(value) => onChange({ ctaStyle: value as LinkCtaStyle })}
            />

            {style.ctaStyle !== "none" && (
              <>
                <Field label="CTA text" htmlFor="card-cta-text">
                  <input
                    id="card-cta-text"
                    type="text"
                    value={style.ctaText}
                    maxLength={40}
                    onChange={(event) => onChange({ ctaText: event.target.value })}
                    placeholder="Open link"
                    className={INPUT_CLASS}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorPicker label="CTA background" value={style.ctaBackgroundColor} onChange={(ctaBackgroundColor) => onChange({ ctaBackgroundColor })} />
                  <ColorPicker label="CTA text" value={style.ctaTextColor} onChange={(ctaTextColor) => onChange({ ctaTextColor })} />
                </div>
              </>
            )}
          </div>
        </EditorSection>
      )}

      <EditorSection title="Focus highlight" description="Pull attention to this link when the page opens. Only one saved link is highlighted at a time." icon={Sparkles}>
        <div className="space-y-5">
          <SegmentedControl
            label="Effect"
            value={style.focusEffect}
            options={[
              { value: "none", label: "Off" },
              { value: "glow", label: "Glow" },
              { value: "shake", label: "Shake" },
              { value: "glow-shake", label: "Both" },
            ]}
            onChange={(value) => onChange({ focusEffect: value as LinkFocusEffect })}
          />
          {style.focusEffect !== "none" && (
            <>
              <ToggleRow label="Dim other links" description="Reduce surrounding card opacity while this link is being emphasized." checked={style.dimSiblings} onChange={(dimSiblings) => onChange({ dimSiblings })} />
              <ToggleRow label="Only once per session" description="Do not repeat this focus animation again while the same visitor keeps this browser session open." checked={style.focusOncePerSession} onChange={(focusOncePerSession) => onChange({ focusOncePerSession })} />
              <ColorPicker label="Highlight color" value={style.focusColor} onChange={(focusColor) => onChange({ focusColor })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <RangeField label="Start delay" value={style.focusDelayMs} min={0} max={5000} step={250} suffix="ms" onChange={(focusDelayMs) => onChange({ focusDelayMs })} />
                <RangeField label="Focus window" value={style.focusDurationMs} min={1500} max={10000} step={500} suffix="ms" onChange={(focusDurationMs) => onChange({ focusDurationMs })} />
              </div>
            </>
          )}
        </div>
      </EditorSection>
    </>
  );
}
