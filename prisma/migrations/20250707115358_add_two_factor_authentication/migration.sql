-- AlterTable
ALTER TABLE `users` ADD COLUMN `backupCodes` TEXT NULL,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `twoFactorSecret` VARCHAR(255) NULL,
    ADD COLUMN `twoFactorSetupAt` DATETIME(3) NULL;
