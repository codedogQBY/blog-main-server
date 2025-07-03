-- CreateTable
CREATE TABLE `friend_links` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `logo` VARCHAR(255) NULL,
    `description` VARCHAR(255) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
