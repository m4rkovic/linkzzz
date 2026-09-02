import type { LinkSensitiveContent, PublicProfileLink } from "@/types/profile";

export const DEFAULT_SENSITIVE_CONTENT_WARNING: Required<LinkSensitiveContent> = {
  enabled: false,
  title: "Sensitive content",
  message: "This destination may contain sensitive or mature content.",
  continueLabel: "Continue",
};

export function resolveSensitiveContentWarning(
  link: Pick<PublicProfileLink, "sensitiveContent">,
): Required<LinkSensitiveContent> | null {
  if (!link.sensitiveContent?.enabled) return null;
  return {
    enabled: true,
    title: link.sensitiveContent.title?.trim() || DEFAULT_SENSITIVE_CONTENT_WARNING.title,
    message: link.sensitiveContent.message?.trim() || DEFAULT_SENSITIVE_CONTENT_WARNING.message,
    continueLabel: link.sensitiveContent.continueLabel?.trim() || DEFAULT_SENSITIVE_CONTENT_WARNING.continueLabel,
  };
}
