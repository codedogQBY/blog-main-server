-- CreateTable
CREATE TABLE `about` (
    `id` VARCHAR(191) NOT NULL,
    `heroAvatar` TEXT NULL,
    `heroSignature` VARCHAR(200) NULL,
    `introTitle` VARCHAR(200) NOT NULL,
    `introContent` TEXT NOT NULL,
    `introLogo` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `about_tags` (
    `id` VARCHAR(191) NOT NULL,
    `content` VARCHAR(100) NOT NULL,
    `position` VARCHAR(191) NOT NULL DEFAULT 'left',
    `sort` INTEGER NOT NULL DEFAULT 0,
    `aboutId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `about_tags_aboutId_fkey`(`aboutId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `about_sections` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `aboutId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `about_sections_aboutId_fkey`(`aboutId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `about_images` (
    `id` VARCHAR(191) NOT NULL,
    `src` TEXT NOT NULL,
    `alt` VARCHAR(200) NOT NULL,
    `caption` VARCHAR(200) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `sectionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `about_images_sectionId_fkey`(`sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `about_tags` ADD CONSTRAINT `about_tags_aboutId_fkey` FOREIGN KEY (`aboutId`) REFERENCES `about`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `about_sections` ADD CONSTRAINT `about_sections_aboutId_fkey` FOREIGN KEY (`aboutId`) REFERENCES `about`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `about_images` ADD CONSTRAINT `about_images_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `about_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
