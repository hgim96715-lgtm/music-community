-- CreateTable
CREATE TABLE "Dm" (
    "id" UUID NOT NULL,
    "pairKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Dm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmMember" (
    "id" UUID NOT NULL,
    "dmId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lastReadAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DmMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmMessage" (
    "id" UUID NOT NULL,
    "dmId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DmMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dm_pairKey_key" ON "Dm"("pairKey");

-- CreateIndex
CREATE INDEX "DmMember_userId_idx" ON "DmMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DmMember_dmId_userId_key" ON "DmMember"("dmId", "userId");

-- CreateIndex
CREATE INDEX "DmMessage_dmId_createdAt_idx" ON "DmMessage"("dmId", "createdAt");

-- CreateIndex
CREATE INDEX "DmMessage_senderId_idx" ON "DmMessage"("senderId");

-- AddForeignKey
ALTER TABLE "DmMember" ADD CONSTRAINT "DmMember_dmId_fkey" FOREIGN KEY ("dmId") REFERENCES "Dm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmMember" ADD CONSTRAINT "DmMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmMessage" ADD CONSTRAINT "DmMessage_dmId_fkey" FOREIGN KEY ("dmId") REFERENCES "Dm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmMessage" ADD CONSTRAINT "DmMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
