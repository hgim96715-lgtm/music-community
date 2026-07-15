-- CreateEnum
CREATE TYPE "RoomVisibility" AS ENUM ('public', 'private', 'invite');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('active', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "RoomMemberRole" AS ENUM ('member', 'moderator', 'owner');

-- CreateEnum
CREATE TYPE "RoomMessageType" AS ENUM ('text', 'recommendation');

-- CreateTable
CREATE TABLE "Room" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "description" TEXT,
    "topicTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" "RoomVisibility" NOT NULL DEFAULT 'public',
    "status" "RoomStatus" NOT NULL DEFAULT 'active',
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "RoomMemberRole" NOT NULL DEFAULT 'member',
    "mutedUntil" TIMESTAMPTZ(3),
    "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMessage" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "type" "RoomMessageType" NOT NULL DEFAULT 'text',
    "body" TEXT,
    "recommendationId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "RoomMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Room_status_visibility_idx" ON "Room"("status", "visibility");

-- CreateIndex
CREATE INDEX "Room_ownerId_idx" ON "Room"("ownerId");

-- CreateIndex
CREATE INDEX "RoomMember_userId_idx" ON "RoomMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_roomId_userId_key" ON "RoomMember"("roomId", "userId");

-- CreateIndex
CREATE INDEX "RoomMessage_roomId_createdAt_idx" ON "RoomMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "RoomMessage_senderId_idx" ON "RoomMessage"("senderId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
