-- AlterTable
ALTER TABLE `friend_links` ADD COLUMN `auditStatus` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `email` VARCHAR(255) NULL;
