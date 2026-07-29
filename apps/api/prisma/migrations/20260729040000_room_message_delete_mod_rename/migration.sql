-- RenameColumns (deleteBy* → deletedBy*)
ALTER TABLE "RoomMessage" RENAME COLUMN "deleteByOwner" TO "deletedByOwner";
ALTER TABLE "RoomMessage" RENAME COLUMN "deleteById" TO "deletedById";

ALTER INDEX "RoomMessage_deleteById_idx" RENAME TO "RoomMessage_deletedById_idx";

ALTER TABLE "RoomMessage" RENAME CONSTRAINT "RoomMessage_deleteById_fkey" TO "RoomMessage_deletedById_fkey";
