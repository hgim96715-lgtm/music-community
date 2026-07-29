-- DropIndex
DROP INDEX "RoomMessageReaction_messageId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "RoomMessageReaction_messageId_userId_emoji_key" ON "RoomMessageReaction"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "RoomMessageReaction_messageId_idx" ON "RoomMessageReaction"("messageId");
