-- Phase 3.12: move page/media runtime fields out of hidden JSON wrapper keys
-- and add relational gallery asset references.

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

-- Backfill page-level fields previously hidden in appearance.__media/__engagement.
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
  END,
  "appearance" = "appearance" - '__media' - '__engagement';

-- Backfill PageCard fields from the legacy customStyle wrapper. Existing rows
-- that predate the wrapper are preserved as direct customStyle JSON.
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
  END,
  "customStyle" = CASE
    WHEN "customStyle" IS NULL THEN NULL
    WHEN "customStyle" ? 'value'
      OR "customStyle" ? '__imageUrl'
      OR "customStyle" ? '__imageAlt'
      OR "customStyle" ? '__availability'
      OR "customStyle" ? '__sensitiveContent'
      OR "customStyle" ? '__geo'
      THEN CASE
        WHEN "customStyle"->'value' IS NULL OR "customStyle"->'value' = 'null'::jsonb
          THEN NULL
        ELSE "customStyle"->'value'
      END
    ELSE "customStyle"
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
