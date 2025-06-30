/*
  Warnings:

  - You are about to drop the column `category` on the `gallery_images` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `gallery_images` table. All the data in the column will be lost.
  - You are about to drop the column `galleryImageId` on the `interaction_comments` table. All the data in the column will be lost.
  - You are about to drop the column `galleryImageId` on the `likes` table. All the data in the column will be lost.
  - Added the required column `galleryId` to the `gallery_images` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `interaction_comments` DROP FOREIGN KEY `interaction_comments_galleryImageId_fkey`;

-- DropForeignKey
ALTER TABLE `likes` DROP FOREIGN KEY `likes_galleryImageId_fkey`;

-- AlterTable
ALTER TABLE `gallery_images` DROP COLUMN `category`,
    DROP COLUMN `tags`,
    ADD COLUMN `galleryId` VARCHAR(191) NOT NULL,
    ADD COLUMN `sort` INTEGER NOT NULL DEFAULT 0,
    MODIFY `title` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `interaction_comments` DROP COLUMN `galleryImageId`,
    ADD COLUMN `galleryId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `likes` DROP COLUMN `galleryImageId`,
    ADD COLUMN `galleryId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `galleries` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `tags` TEXT NULL,
    `coverImage` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'published',
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `gallery_images_galleryId_fkey` ON `gallery_images`(`galleryId`);

-- CreateIndex
CREATE INDEX `interaction_comments_galleryId_fkey` ON `interaction_comments`(`galleryId`);

-- CreateIndex
CREATE INDEX `likes_galleryId_fkey` ON `likes`(`galleryId`);

-- AddForeignKey
ALTER TABLE `gallery_images` ADD CONSTRAINT `gallery_images_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `galleries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `galleries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interaction_comments` ADD CONSTRAINT `interaction_comments_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `galleries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
