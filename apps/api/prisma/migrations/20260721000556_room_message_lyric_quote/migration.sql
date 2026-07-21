-- AlterEnum
ALTER TYPE "RoomMessageType" ADD VALUE 'lyric_quote';

-- AlterTable
ALTER TABLE "RoomMessage" ADD COLUMN     "lyricEndSec" INTEGER,
ADD COLUMN     "lyricStartSec" INTEGER;
