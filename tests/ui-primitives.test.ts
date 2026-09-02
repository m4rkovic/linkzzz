import assert from "node:assert/strict";
import test from "node:test";

import { badgeClassName } from "../src/components/ui/badge";
import { buttonClassName } from "../src/components/ui/button";
import { cardClassName } from "../src/components/ui/card";
import { controlClassName } from "../src/components/ui/form-control";
import { cx } from "../src/lib/class-names";

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

