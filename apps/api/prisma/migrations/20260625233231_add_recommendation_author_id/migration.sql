-- authorId: 기존 글에 작성자 없음 → nullable 추가 → User 있으면 백필 → 없으면 테스트 글 삭제 → NOT NULL

ALTER TABLE "Recommendation" ADD COLUMN "authorId" UUID;

UPDATE "Recommendation"
SET "authorId" = (
  SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "authorId" IS NULL;

DELETE FROM "Reaction"
WHERE "recommendationId" IN (
  SELECT "id" FROM "Recommendation" WHERE "authorId" IS NULL
);

DELETE FROM "Recommendation" WHERE "authorId" IS NULL;

ALTER TABLE "Recommendation" ALTER COLUMN "authorId" SET NOT NULL;

CREATE INDEX "Recommendation_authorId_idx" ON "Recommendation"("authorId");

ALTER TABLE "Recommendation"
ADD CONSTRAINT "Recommendation_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
