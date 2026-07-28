-- CreateTable
CREATE TABLE "RoomMessageHide" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMessageHide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomMessageHide_userId_idx" ON "RoomMessageHide"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMessageHide_messageId_userId_key" ON "RoomMessageHide"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "RoomMessageHide" ADD CONSTRAINT "RoomMessageHide_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "RoomMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMessageHide" ADD CONSTRAINT "RoomMessageHide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
