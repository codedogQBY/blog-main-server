-- CreateTable
CREATE TABLE `performance_data` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `source` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `value` DOUBLE NULL,
    `duration` INTEGER NULL,
    `url` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `userName` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `requestId` VARCHAR(191) NULL,
    `deviceInfo` TEXT NULL,
    `pageUrl` VARCHAR(191) NULL,
    `time` BIGINT NULL,
    `status` VARCHAR(191) NULL,
    `sdkVersion` VARCHAR(191) NULL,
    `uuid` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `tags` TEXT NULL,
    `apikey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `performance_data_timestamp_idx`(`timestamp`),
    INDEX `performance_data_source_idx`(`source`),
    INDEX `performance_data_type_idx`(`type`),
    INDEX `performance_data_userId_idx`(`userId`),
    INDEX `performance_data_sessionId_idx`(`sessionId`),
    INDEX `performance_data_apikey_idx`(`apikey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
