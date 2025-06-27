-- AlterTable
ALTER TABLE `VerificationCode` MODIFY `code` CHAR(6) NOT NULL,
    MODIFY `expiresAt` DATETIME(3) NOT NULL;
