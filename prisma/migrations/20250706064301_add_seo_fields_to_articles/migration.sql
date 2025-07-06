-- AlterTable
ALTER TABLE `articles` ADD COLUMN `canonicalUrl` VARCHAR(500) NULL,
    ADD COLUMN `metaDescription` TEXT NULL,
    ADD COLUMN `metaKeywords` TEXT NULL,
    ADD COLUMN `metaTitle` VARCHAR(255) NULL;
