import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { badgeClassName } from "../src/components/ui/badge";
import { buttonClassName } from "../src/components/ui/button";
import { cardClassName } from "../src/components/ui/card";
import { controlClassName } from "../src/components/ui/form-control";
import { cx } from "../src/lib/class-names";

test("Tailwind is wired through PostCSS so utility classes reach the browser", () => {
  const postcssConfig = readFileSync(
    new URL("../postcss.config.mjs", import.meta.url),
    "utf8",
  );

  assert.match(postcssConfig, /["']@tailwindcss\/postcss["']/);
});

test("application layout has no remote font compile dependency", () => {
  const rootLayout = readFileSync(
    new URL("../src/app/layout.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(rootLayout, /next\/font\/google/);
});

test("cx keeps only meaningful class names", () => {
  assert.equal(cx("base", false, undefined, "active", null), "base active");
});

test("button variants preserve the Linkzzz action hierarchy", () => {
  assert.match(buttonClassName({ variant: "primary" }), /bg-brand-lime/);
  assert.match(buttonClassName({ variant: "accent" }), /bg-brand-violet/);
  assert.match(buttonClassName({ variant: "danger" }), /text-red-700/);
});

test("badge tones preserve semantic brand colors", () => {
  assert.match(badgeClassName({ tone: "success" }), /bg-brand-lime-soft/);
  assert.match(badgeClassName({ tone: "accent" }), /bg-brand-violet-soft/);
  assert.match(badgeClassName({ tone: "danger" }), /bg-red-50/);
});

test("cards and controls share the expected interaction treatment", () => {
  assert.match(cardClassName({ interactive: true }), /hover:border-brand-violet/);
  assert.match(controlClassName(), /focus:border-brand-violet/);
  assert.match(controlClassName("pl-10"), /pl-10/);
});

test("mobile navigation and filter controls do not rely on horizontal scrolling", () => {
  const responsiveControlFiles = [
    "../src/components/smart-links/editor/editor-navigation.tsx",
    "../src/components/smart-links/editor/page-workspace.tsx",
    "../src/components/appearance/editor/appearance-editor-navigation.tsx",
    "../src/components/links/editor/link-editor-form.tsx",
    "../src/components/destinations/destination-picker.tsx",
    "../src/components/analytics/analytics-period-tabs.tsx",
  ];

  for (const path of responsiveControlFiles) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /overflow-x-(?:auto|scroll)|min-w-max/, path);
  }
});

test("modal surfaces use the shared accessible dialog boundary", () => {
  const dialogSource = readFileSync(
    new URL("../src/components/ui/dialog.tsx", import.meta.url),
    "utf8",
  );
  assert.match(dialogSource, /useDialogFocus/);
  assert.match(dialogSource, /aria-modal="true"/);
  assert.match(dialogSource, /createPortal/);

  const modalFiles = [
    "../src/components/ui/confirm-dialog.tsx",
    "../src/components/admin/ui/admin-confirm-dialog.tsx",
    "../src/components/account/change-password-modal.tsx",
    "../src/components/admin/user/reset-password-modal.tsx",
    "../src/components/admin/user/suspend-user-modal.tsx",
    "../src/components/destinations/destination-picker.tsx",
    "../src/components/dashboard/dashboard-shell.tsx",
    "../src/components/admin/admin-shell.tsx",
  ];

  for (const path of modalFiles) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /DialogShell|ConfirmDialog/, path);
  }
});

test("editor subtabs expose keyboard-accessible tab semantics", () => {
  const source = readFileSync(
    new URL("../src/components/links/editor/link-editor-primitives.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /role="tablist"/);
  assert.match(source, /role="tab"/);
  assert.match(source, /aria-selected/);
  assert.match(source, /tabIndex=/);
  assert.match(source, /ArrowRight/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /Home/);
  assert.match(source, /End/);
});
