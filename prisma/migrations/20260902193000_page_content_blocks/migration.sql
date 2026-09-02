-- Phase 12: heterogeneous Landing Page blocks + lightweight email lead capture.
ALTER TABLE "Page"
ADD COLUMN "contentBlocks" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE "LeadSubmission" (
    "id" TEXT NOT NULL,
    "smartLinkId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeadSubmission_smartLinkId_idx" ON "LeadSubmission"("smartLinkId");
CREATE INDEX "LeadSubmission_blockId_idx" ON "LeadSubmission"("blockId");
CREATE INDEX "LeadSubmission_createdAt_idx" ON "LeadSubmission"("createdAt");

ALTER TABLE "LeadSubmission"
ADD CONSTRAINT "LeadSubmission_smartLinkId_fkey"
FOREIGN KEY ("smartLinkId") REFERENCES "SmartLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
