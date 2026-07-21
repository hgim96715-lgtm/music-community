-- CreateTable
CREATE TABLE "SavedLyric" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "recommendationId" UUID NOT NULL,
    "lyricsText" TEXT NOT NULL,
    "note" TEXT,
    "startSec" INTEGER,
    "endSec" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SavedLyric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedLyric_userId_idx" ON "SavedLyric"("userId");

-- CreateIndex
CREATE INDEX "SavedLyric_recommendationId_idx" ON "SavedLyric"("recommendationId");

-- AddForeignKey
ALTER TABLE "SavedLyric" ADD CONSTRAINT "SavedLyric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedLyric" ADD CONSTRAINT "SavedLyric_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
