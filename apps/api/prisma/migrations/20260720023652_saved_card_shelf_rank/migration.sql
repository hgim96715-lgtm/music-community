-- AlterTable
ALTER TABLE "SavedCard" ADD COLUMN     "shelfRank" INTEGER;

-- CreateIndex
CREATE INDEX "SavedCard_userId_shelfRank_idx" ON "SavedCard"("userId", "shelfRank");
