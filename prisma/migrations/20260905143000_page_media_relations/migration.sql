-- Phase 3.12 expand step: add first-class page/media fields and relational
-- gallery asset references without deleting the legacy JSON transport yet.
--
-- The legacy wrappers intentionally remain populated for one compatibility
-- window so an application rollback to the pre-3.12 code can still read the
-- same profile state. A later contract migration may remove them after the new
-- persistence model has been validated in production.

ALTER TABLE "Page"
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "coverImageUrl" TEXT,
  ADD COLUMN "engagement" JSONB;

ALTER TABLE "PageCard"
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "imageAlt" TEXT,
  ADD COLUMN "availability" JSONB,
  ADD COLUMN "sensitiveContent" JSONB,
  ADD COLUMN "geoConfig" JSONB;

CREATE TABLE "PageContentAssetReference" (
  "pageId" TEXT NOT NULL,
  "blockId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageContentAssetReference_pkey" PRIMARY KEY ("pageId", "blockId", "itemId"),
  CONSTRAINT "PageContentAssetReference_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PageContentAssetReference_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PageContentAssetReference_assetId_idx"
  ON "PageContentAssetReference"("assetId");
CREATE INDEX "PageContentAssetReference_pageId_blockId_sortOrder_idx"
  ON "PageContentAssetReference"("pageId", "blockId", "sortOrder");

-- Backfill first-class page fields while preserving appearance.__media and
-- appearance.__engagement for rollback compatibility.
UPDATE "Page"
SET
  "avatarUrl" = CASE
    WHEN jsonb_typeof("appearance"->'__media'->'avatarUrl') = 'string'
      THEN "appearance"->'__media'->>'avatarUrl'
    ELSE NULL
  END,
  "coverImageUrl" = CASE
    WHEN jsonb_typeof("appearance"->'__media'->'coverImageUrl') = 'string'
      THEN "appearance"->'__media'->>'coverImageUrl'
    ELSE NULL
  END,
  "engagement" = CASE
    WHEN jsonb_typeof("appearance"->'__engagement') = 'object'
      THEN "appearance"->'__engagement'
    ELSE NULL
  END;

-- Backfill first-class PageCard fields while preserving the legacy customStyle
-- envelope. The new application dual-writes that envelope during this expand
-- release so the previous application version remains a viable rollback.
UPDATE "PageCard"
SET
  "imageUrl" = CASE
    WHEN jsonb_typeof("customStyle"->'__imageUrl') = 'string'
      THEN "customStyle"->>'__imageUrl'
    ELSE NULL
  END,
  "imageAlt" = CASE
    WHEN jsonb_typeof("customStyle"->'__imageAlt') = 'string'
      THEN "customStyle"->>'__imageAlt'
    ELSE NULL
  END,
  "availability" = CASE
    WHEN jsonb_typeof("customStyle"->'__availability') = 'object'
      THEN "customStyle"->'__availability'
    ELSE NULL
  END,
  "sensitiveContent" = CASE
    WHEN jsonb_typeof("customStyle"->'__sensitiveContent') = 'object'
      THEN "customStyle"->'__sensitiveContent'
    ELSE NULL
  END,
  "geoConfig" = CASE
    WHEN jsonb_typeof("customStyle"->'__geo') = 'object'
      THEN "customStyle"->'__geo'
    ELSE NULL
  END;

-- Backfill relational references for gallery images. The content block payload
-- remains JSON for now, but asset liveness no longer depends on scanning JSON.
INSERT INTO "PageContentAssetReference" (
  "pageId",
  "blockId",
  "itemId",
  "assetId",
  "sortOrder"
)
SELECT
  page_row."id",
  block_row.value->>'id',
  image_row.value->>'id',
  image_row.value->>'imageAssetId',
  (image_row.ordinality - 1)::INTEGER
FROM "Page" AS page_row
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(page_row."contentBlocks") = 'array'
      THEN page_row."contentBlocks"
    ELSE '[]'::jsonb
  END
) AS block_row(value)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(block_row.value->'images') = 'array'
      THEN block_row.value->'images'
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS image_row(value, ordinality)
INNER JOIN "Asset" AS asset_row
  ON asset_row."id" = image_row.value->>'imageAssetId'
 AND asset_row."smartLinkId" = page_row."smartLinkId"
WHERE block_row.value->>'type' = 'GALLERY'
  AND COALESCE(block_row.value->>'id', '') <> ''
  AND COALESCE(image_row.value->>'id', '') <> ''
  AND COALESCE(image_row.value->>'imageAssetId', '') <> ''
ON CONFLICT DO NOTHING;
