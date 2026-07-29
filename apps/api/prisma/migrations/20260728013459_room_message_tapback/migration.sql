-- AlterTable
ALTER TABLE "RoomMessage" ADD COLUMN     "replyToId" UUID;

-- CreateTable
CREATE TABLE "RoomMessageReaction" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomMessageReaction_userId_idx" ON "RoomMessageReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMessageReaction_messageId_userId_key" ON "RoomMessageReaction"("messageId", "userId");

-- CreateIndex
CREATE INDEX "RoomMessage_replyToId_idx" ON "RoomMessage"("replyToId");

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "RoomMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMessageReaction" ADD CONSTRAINT "RoomMessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "RoomMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMessageReaction" ADD CONSTRAINT "RoomMessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
