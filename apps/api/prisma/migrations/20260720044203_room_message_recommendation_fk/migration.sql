-- CreateIndex
CREATE INDEX "RoomMessage_recommendationId_idx" ON "RoomMessage"("recommendationId");

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
