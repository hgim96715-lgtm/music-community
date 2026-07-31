-- CreateEnum
CREATE TYPE "DmStatus" AS ENUM ('pending', 'open', 'declined');

-- AlterTable
ALTER TABLE "Dm" ADD COLUMN     "requestedById" UUID,
ADD COLUMN     "status" "DmStatus" NOT NULL DEFAULT 'open';

-- CreateIndex
CREATE INDEX "Dm_status_idx" ON "Dm"("status");

-- CreateIndex
CREATE INDEX "Dm_requestedById_idx" ON "Dm"("requestedById");

-- AddForeignKey
ALTER TABLE "Dm" ADD CONSTRAINT "Dm_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
