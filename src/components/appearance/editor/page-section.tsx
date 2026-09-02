import { MoveVertical, Palette } from "lucide-react";

import ColorPicker from "@/components/ui/color-picker";
import {
  RangeField,
  SegmentedControl,
  SelectField,
} from "@/components/ui/editor-controls";
import { AppearanceSection } from "./appearance-section";
import type {
  BackgroundEffect,
  BackgroundType,
  PageAppearance,
  PageMobileColumns,
  ProfileAppearance,
} from "@/types/profile";

export default function PageSection({
  panel,
  appearance,
  page,
  onAppearanceChange,
  onPageChange,
}: {
  panel: "background" | "layout";
  appearance: ProfileAppearance;
  page: PageAppearance;
  onAppearanceChange: (values: Partial<ProfileAppearance>) => void;
  onPageChange: (values: Partial<PageAppearance>) => void;
}) {
  if (panel === "background") {
    return (
      <AppearanceSection
        icon={Palette}
        title="Page background"
        description="Canvas colors, text contrast and ambient glow effects."
      >
        <div className="space-y-5">
          <SegmentedControl
            label="Background"
            value={appearance.backgroundType}
            options={[
              { value: "solid", label: "Solid" },
              { value: "gradient", label: "Gradient" },
            ]}
            onChange={(value) =>
              onAppearanceChange({ backgroundType: value as BackgroundType })
            }
          />

          {appearance.backgroundType === "solid" ? (
            <ColorPicker
              label="Background color"
              value={appearance.backgroundColor}
              onChange={(value) => onAppearanceChange({ backgroundColor: value })}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorPicker
                  label="Gradient start"
                  value={appearance.gradientFrom}
                  onChange={(value) => onAppearanceChange({ gradientFrom: value })}
                />
                <ColorPicker
                  label="Gradient end"
                  value={appearance.gradientTo}
                  onChange={(value) => onAppearanceChange({ gradientTo: value })}
                />
              </div>
              <RangeField
                label="Gradient angle"
                value={appearance.gradientAngle ?? 135}
                min={0}
                max={360}
                step={5}
                suffix="°"
                onChange={(gradientAngle) => onAppearanceChange({ gradientAngle })}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorPicker
              label="Primary text"
              value={appearance.primaryTextColor}
              onChange={(value) => onAppearanceChange({ primaryTextColor: value })}
            />
            <ColorPicker
              label="Secondary text"
              value={appearance.secondaryTextColor}
              onChange={(value) => onAppearanceChange({ secondaryTextColor: value })}
            />
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
            <p className="text-sm font-semibold text-zinc-900">Ambient background</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Adds a subtle glow layer without changing page content or card colors.
            </p>
            <div className="mt-4 space-y-4">
              <SelectField
                label="Effect"
                value={appearance.backgroundEffect ?? "none"}
                onChange={(value) =>
                  onAppearanceChange({ backgroundEffect: value as BackgroundEffect })
                }
                options={[
                  { value: "none", label: "None" },
                  { value: "soft-glow", label: "Soft glow" },
                  { value: "mesh", label: "Mesh glow" },
                ]}
              />
              {(appearance.backgroundEffect ?? "none") !== "none" && (
                <>
                  <ColorPicker
                    label="Glow color"
                    value={
                      appearance.backgroundEffectColor ?? appearance.primaryTextColor
                    }
                    onChange={(backgroundEffectColor) =>
                      onAppearanceChange({ backgroundEffectColor })
                    }
                  />
                  <RangeField
                    label="Glow intensity"
                    value={Math.round(
                      (appearance.backgroundEffectIntensity ?? 0.2) * 100,
                    )}
                    min={5}
                    max={100}
                    step={5}
                    suffix="%"
                    onChange={(value) =>
                      onAppearanceChange({ backgroundEffectIntensity: value / 100 })
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </AppearanceSection>
    );
  }

  return (
    <AppearanceSection
      icon={MoveVertical}
      title="Page spacing"
      description="Responsive width, padding, section rhythm and shared block surfaces."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <RangeField
            label="Page width"
            value={page.maxWidth}
            min={480}
            max={1120}
            step={20}
            suffix="px"
            onChange={(maxWidth) => onPageChange({ maxWidth })}
          />
          <RangeField
            label="Vertical breathing room"
            value={page.verticalPadding}
            min={0}
            max={80}
            step={4}
            suffix="px"
            onChange={(verticalPadding) => onPageChange({ verticalPadding })}
          />
          <RangeField
            label="Desktop side padding"
            value={page.horizontalPadding}
            min={8}
            max={64}
            step={2}
            suffix="px"
            onChange={(horizontalPadding) => onPageChange({ horizontalPadding })}
          />
          <RangeField
            label="Mobile side padding"
            value={page.mobileHorizontalPadding}
            min={8}
            max={32}
            step={2}
            suffix="px"
            onChange={(mobileHorizontalPadding) =>
              onPageChange({ mobileHorizontalPadding })
            }
          />
          <RangeField
            label="Desktop section spacing"
            value={page.sectionSpacing}
            min={8}
            max={64}
            step={2}
            suffix="px"
            onChange={(sectionSpacing) => onPageChange({ sectionSpacing })}
          />
          <RangeField
            label="Mobile section spacing"
            value={page.mobileSectionSpacing}
            min={6}
            max={40}
            step={2}
            suffix="px"
            onChange={(mobileSectionSpacing) =>
              onPageChange({ mobileSectionSpacing })
            }
          />
        </div>

        <SegmentedControl
          label="Mobile visual-card columns"
          value={String(page.mobileColumns)}
          options={[
            { value: "1", label: "One column" },
            { value: "2", label: "Two columns" },
          ]}
          onChange={(value) =>
            onPageChange({ mobileColumns: Number(value) as PageMobileColumns })
          }
        />

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
          <p className="text-sm font-semibold text-zinc-900">Content block surfaces</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Shared colors for text, CTA, gallery and email blocks that use a card surface.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ColorPicker
              label="Surface color"
              value={page.sectionBackgroundColor}
              onChange={(sectionBackgroundColor) =>
                onPageChange({ sectionBackgroundColor })
              }
            />
            <ColorPicker
              label="Border color"
              value={page.sectionBorderColor}
              onChange={(sectionBorderColor) => onPageChange({ sectionBorderColor })}
            />
          </div>
          <div className="mt-4">
            <RangeField
              label="Surface opacity"
              value={Math.round(page.sectionSurfaceOpacity * 100)}
              min={0}
              max={100}
              step={5}
              suffix="%"
              onChange={(value) =>
                onPageChange({ sectionSurfaceOpacity: value / 100 })
              }
            />
          </div>
        </div>
      </div>
    </AppearanceSection>
  );
}
