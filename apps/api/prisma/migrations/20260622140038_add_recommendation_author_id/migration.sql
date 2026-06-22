-- Add authorId (nullable first for existing rows)
ALTER TABLE "Recommendation" ADD COLUMN "authorId" TEXT;

-- Backfill dev data: assign oldest user as author
UPDATE "Recommendation"
SET "authorId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "authorId" IS NULL;

-- Orphan rows when no users exist
DELETE FROM "Reaction"
WHERE "recommendationId" IN (
  SELECT "id" FROM "Recommendation" WHERE "authorId" IS NULL
);
DELETE FROM "Recommendation" WHERE "authorId" IS NULL;

ALTER TABLE "Recommendation" ALTER COLUMN "authorId" SET NOT NULL;

ALTER TABLE "Recommendation"
ADD CONSTRAINT "Recommendation_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
