-- Replace single-column PageCard ordering indexes with the access path used by
-- page reads: cards belonging to one page ordered by their saved position.
DROP INDEX "PageCard_pageId_idx";
DROP INDEX "PageCard_sortOrder_idx";
CREATE INDEX "PageCard_pageId_sortOrder_idx"
ON "PageCard"("pageId", "sortOrder");

-- Analytics dashboards scope by SmartLink before filtering by time, traffic
-- class or event type. These indexes also retain the prefix lookups previously
-- covered by the standalone smartLinkId/pageCardId indexes.
DROP INDEX "AnalyticsEvent_smartLinkId_idx";
DROP INDEX "AnalyticsEvent_pageCardId_idx";
CREATE INDEX "AnalyticsEvent_smartLinkId_createdAt_idx"
ON "AnalyticsEvent"("smartLinkId", "createdAt");
CREATE INDEX "AnalyticsEvent_smartLinkId_isBot_type_createdAt_idx"
ON "AnalyticsEvent"("smartLinkId", "isBot", "type", "createdAt");
CREATE INDEX "AnalyticsEvent_pageCardId_type_createdAt_idx"
ON "AnalyticsEvent"("pageCardId", "type", "createdAt");

-- Keep the database invariant aligned with the domain service: a domain may
-- become ACTIVE only after successful ownership verification.
ALTER TABLE "CustomDomain"
ADD CONSTRAINT "CustomDomain_active_requires_verification"
CHECK ("status" <> 'ACTIVE' OR "verifiedAt" IS NOT NULL) NOT VALID;

ALTER TABLE "CustomDomain"
VALIDATE CONSTRAINT "CustomDomain_active_requires_verification";
