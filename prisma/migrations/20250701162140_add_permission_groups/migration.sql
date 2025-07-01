-- AlterTable
ALTER TABLE `Permission` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `groupId` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `PermissionGroup` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PermissionGroup_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `permissions_groupId_fkey` ON `Permission`(`groupId`);

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `PermissionGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
