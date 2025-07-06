-- AlterTable
ALTER TABLE `system_logs` ADD COLUMN `recordScreen` LONGTEXT NULL,
    ADD COLUMN `recordScreenId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `system_logs_recordScreenId_idx` ON `system_logs`(`recordScreenId`);
