-- CreateEnum
CREATE TYPE "AlbumVisibility" AS ENUM ('private', 'public');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "albumVisibility" "AlbumVisibility" NOT NULL DEFAULT 'private';
