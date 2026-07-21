-- AlterEnum
ALTER TYPE "RoomMessageType" ADD VALUE 'saved_card';

-- AlterTable
ALTER TABLE "RoomMessage" ADD COLUMN "savedCardId" UUID;

-- CreateIndex
CREATE INDEX "RoomMessage_savedCardId_idx" ON "RoomMessage"("savedCardId");
