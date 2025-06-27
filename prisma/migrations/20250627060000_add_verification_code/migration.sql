-- Add VerificationCode table
CREATE TABLE `VerificationCode` (
  `id` CHAR(36) NOT NULL,
  `mail` VARCHAR(100) NOT NULL,
  `code` VARCHAR(6) NOT NULL,
  `expiresAt` TIMESTAMP(0) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `VerificationCode_mail_idx` (`mail`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
