-- AlterTable
ALTER TABLE "RoomMessage" ADD COLUMN     "deleteById" UUID,
ADD COLUMN     "deleteByOwner" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "RoomMessage_deleteById_idx" ON "RoomMessage"("deleteById");

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_deleteById_fkey" FOREIGN KEY ("deleteById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
