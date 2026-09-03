import type { Plan } from "@/server/business/plans";

export class PageCardDuplicateLimitError extends Error {
  readonly code = "PAGE_CARD_LIMIT_REACHED" as const;

  constructor(
    readonly plan: Plan,
    readonly limit: number,
    readonly currentCount: number,
  ) {
    super("Landing Page exceeds the current plan card limit.");
    this.name = "PageCardDuplicateLimitError";
  }
}
