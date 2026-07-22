-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMPTZ(3),
ADD COLUMN     "withdrawScheduledAt" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_withdrawScheduledAt_idx" ON "User"("withdrawScheduledAt");
