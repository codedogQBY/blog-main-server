-- AlterTable
ALTER TABLE `Role` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `sticky_notes` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `author` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#fbbf24',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_images` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `likes` (
    `id` VARCHAR(191) NOT NULL,
    `fingerprint` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `articleId` VARCHAR(191) NULL,
    `stickyNoteId` VARCHAR(191) NULL,
    `galleryImageId` VARCHAR(191) NULL,
    `userInfoId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `likes_articleId_fkey`(`articleId`),
    INDEX `likes_galleryImageId_fkey`(`galleryImageId`),
    INDEX `likes_stickyNoteId_fkey`(`stickyNoteId`),
    INDEX `likes_userInfoId_fkey`(`userInfoId`),
    UNIQUE INDEX `likes_fingerprint_targetType_targetId_key`(`fingerprint`, `targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interaction_comments` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `author` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `fingerprint` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `stickyNoteId` VARCHAR(191) NULL,
    `galleryImageId` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `userInfoId` VARCHAR(191) NULL,
    `isApproved` BOOLEAN NOT NULL DEFAULT true,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `interaction_comments_galleryImageId_fkey`(`galleryImageId`),
    INDEX `interaction_comments_parentId_fkey`(`parentId`),
    INDEX `interaction_comments_stickyNoteId_fkey`(`stickyNoteId`),
    INDEX `interaction_comments_userInfoId_fkey`(`userInfoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_info` (
    `id` VARCHAR(191) NOT NULL,
    `fingerprint` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `country` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `timezone` VARCHAR(191) NULL,
    `deviceType` VARCHAR(191) NULL,
    `deviceModel` VARCHAR(191) NULL,
    `osName` VARCHAR(191) NULL,
    `osVersion` VARCHAR(191) NULL,
    `browserName` VARCHAR(191) NULL,
    `browserVersion` VARCHAR(191) NULL,
    `screenWidth` INTEGER NULL,
    `screenHeight` INTEGER NULL,
    `language` VARCHAR(191) NULL,
    `languages` VARCHAR(191) NULL,
    `nickname` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `totalLikes` INTEGER NOT NULL DEFAULT 0,
    `totalComments` INTEGER NOT NULL DEFAULT 0,
    `lastActiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_info_fingerprint_key`(`fingerprint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `permissions` TEXT NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `loginCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_username_key`(`username`),
    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_config` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'string',
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_config_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `fingerprint` VARCHAR(191) NULL,
    `userInfoId` VARCHAR(191) NULL,
    `adminId` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_galleryImageId_fkey` FOREIGN KEY (`galleryImageId`) REFERENCES `gallery_images`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_stickyNoteId_fkey` FOREIGN KEY (`stickyNoteId`) REFERENCES `sticky_notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_userInfoId_fkey` FOREIGN KEY (`userInfoId`) REFERENCES `user_info`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interaction_comments` ADD CONSTRAINT `interaction_comments_galleryImageId_fkey` FOREIGN KEY (`galleryImageId`) REFERENCES `gallery_images`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interaction_comments` ADD CONSTRAINT `interaction_comments_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `interaction_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interaction_comments` ADD CONSTRAINT `interaction_comments_stickyNoteId_fkey` FOREIGN KEY (`stickyNoteId`) REFERENCES `sticky_notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interaction_comments` ADD CONSTRAINT `interaction_comments_userInfoId_fkey` FOREIGN KEY (`userInfoId`) REFERENCES `user_info`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
