-- CreateTable
CREATE TABLE `TwoFactorAttempt` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `attemptType` VARCHAR(20) NOT NULL,
    `success` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserLock` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `lockType` VARCHAR(20) NOT NULL,
    `lockedUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TwoFactorRecovery` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `email` VARCHAR(100) NOT NULL,
    `recoveryCode` VARCHAR(6) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TwoFactorLog` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `action` VARCHAR(50) NOT NULL,
    `details` JSON NULL,
    `adminId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TwoFactorAttempt` ADD CONSTRAINT `TwoFactorAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserLock` ADD CONSTRAINT `UserLock_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TwoFactorRecovery` ADD CONSTRAINT `TwoFactorRecovery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TwoFactorLog` ADD CONSTRAINT `TwoFactorLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TwoFactorLog` ADD CONSTRAINT `TwoFactorLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
