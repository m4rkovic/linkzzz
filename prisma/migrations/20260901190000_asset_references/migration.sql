UPDATE "Profile" AS profile
SET "avatarAssetId" = NULL
WHERE "avatarAssetId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "Asset" AS asset
  WHERE asset."id" = profile."avatarAssetId"
  AND asset."profileId" = profile."id"
  AND asset."type" = 'AVATAR'
);

UPDATE "Profile" AS profile
SET "coverAssetId" = NULL
WHERE "coverAssetId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "Asset" AS asset
  WHERE asset."id" = profile."coverAssetId"
  AND asset."profileId" = profile."id"
  AND asset."type" = 'COVER'
);

UPDATE "Link" AS link
SET "imageAssetId" = NULL
WHERE "imageAssetId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "Asset" AS asset
  WHERE asset."id" = link."imageAssetId"
  AND asset."profileId" = link."profileId"
  AND asset."type" = 'LINK_IMAGE'
);

CREATE INDEX "Profile_avatarAssetId_idx" ON "Profile"("avatarAssetId");
CREATE INDEX "Profile_coverAssetId_idx" ON "Profile"("coverAssetId");
CREATE INDEX "Link_imageAssetId_idx" ON "Link"("imageAssetId");

ALTER TABLE "Profile"
ADD CONSTRAINT "Profile_avatarAssetId_fkey"
FOREIGN KEY ("avatarAssetId") REFERENCES "Asset"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Profile"
ADD CONSTRAINT "Profile_coverAssetId_fkey"
FOREIGN KEY ("coverAssetId") REFERENCES "Asset"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Link"
ADD CONSTRAINT "Link_imageAssetId_fkey"
FOREIGN KEY ("imageAssetId") REFERENCES "Asset"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
