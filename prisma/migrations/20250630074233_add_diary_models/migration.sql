-- CreateTable
CREATE TABLE `diary_notes` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `excerpt` VARCHAR(500) NULL,
    `images` TEXT NULL,
    `weather` VARCHAR(191) NOT NULL DEFAULT 'sunny',
    `mood` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'public',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diary_signatures` (
    `id` VARCHAR(191) NOT NULL,
    `signatureName` VARCHAR(50) NOT NULL,
    `fontFamily` VARCHAR(191) NOT NULL DEFAULT '''Kalam'', cursive',
    `fontSize` VARCHAR(191) NOT NULL DEFAULT '2xl',
    `color` VARCHAR(191) NOT NULL DEFAULT 'gray-400',
    `rotation` VARCHAR(191) NOT NULL DEFAULT '12',
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diary_weather_config` (
    `id` VARCHAR(191) NOT NULL,
    `weatherType` VARCHAR(191) NOT NULL,
    `weatherName` VARCHAR(32) NOT NULL,
    `icon` VARCHAR(100) NULL,
    `description` VARCHAR(200) NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `diary_weather_config_weatherType_key`(`weatherType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
