import { ShieldAlert } from "lucide-react";

import { Field, INPUT_CLASS, ToggleRow } from "@/components/ui/editor-controls";
import type { LinkDraft } from "@/features/links/link-editor-types";
import { EditorSection } from "./link-editor-primitives";

export default function LinkSensitiveContentSection({
  draft,
  onChange,
}: {
  draft: LinkDraft;
  onChange: (values: Partial<LinkDraft>) => void;
}) {
  const warning = draft.sensitiveContent;

  function update(values: Partial<LinkDraft["sensitiveContent"]>) {
    onChange({ sensitiveContent: { ...warning, ...values } });
  }

  return (
    <EditorSection
      title="Sensitive-content warning"
      description="Require a clear confirmation screen before this destination is opened."
      icon={ShieldAlert}
    >
      <ToggleRow
        label="Show warning before opening"
        description="Visitors must explicitly continue before Linkzzz resolves this destination."
        checked={warning.enabled}
        onChange={(enabled) => update({ enabled })}
      />

      {warning.enabled && (
        <div className="mt-5 space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-xs leading-5 text-amber-900">
            Use this for mature, disturbing or otherwise sensitive destinations. It is a visitor warning, not an age-verification system.
          </p>

          <Field label="Warning title" htmlFor="sensitive-warning-title">
            <input
              id="sensitive-warning-title"
              className={INPUT_CLASS}
              value={warning.title ?? ""}
              maxLength={80}
              onChange={(event) => update({ title: event.target.value })}
            />
          </Field>

          <Field label="Warning message" htmlFor="sensitive-warning-message">
            <textarea
              id="sensitive-warning-message"
              className={`${INPUT_CLASS} min-h-24 resize-y py-3`}
              value={warning.message ?? ""}
              maxLength={300}
              onChange={(event) => update({ message: event.target.value })}
            />
          </Field>

          <Field label="Continue button" htmlFor="sensitive-warning-continue">
            <input
              id="sensitive-warning-continue"
              className={INPUT_CLASS}
              value={warning.continueLabel ?? ""}
              maxLength={40}
              onChange={(event) => update({ continueLabel: event.target.value })}
            />
          </Field>
        </div>
      )}
    </EditorSection>
  );
}
