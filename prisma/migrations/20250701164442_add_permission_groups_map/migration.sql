/*
  Warnings:

  - You are about to drop the `PermissionGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Permission` DROP FOREIGN KEY `Permission_groupId_fkey`;

-- DropTable
DROP TABLE `PermissionGroup`;

-- CreateTable
CREATE TABLE `permission_groups` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permission_groups_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `permission_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
