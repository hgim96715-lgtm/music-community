-- CreateTable
CREATE TABLE "RoomChatTheme" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "presetId" TEXT NOT NULL DEFAULT 'lp-bar',
    "backgroundUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RoomChatTheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomChatTheme_roomId_idx" ON "RoomChatTheme"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomChatTheme_userId_roomId_key" ON "RoomChatTheme"("userId", "roomId");

-- AddForeignKey
ALTER TABLE "RoomChatTheme" ADD CONSTRAINT "RoomChatTheme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomChatTheme" ADD CONSTRAINT "RoomChatTheme_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
