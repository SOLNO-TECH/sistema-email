-- AlterTable
ALTER TABLE `domain` ADD COLUMN `smtpApiKey` TEXT NULL,
    ADD COLUMN `smtpHost` VARCHAR(191) NULL,
    ADD COLUMN `smtpPassword` TEXT NULL,
    ADD COLUMN `smtpPort` INTEGER NULL,
    ADD COLUMN `smtpProvider` VARCHAR(50) NULL,
    ADD COLUMN `smtpUser` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `emailaccount` ADD COLUMN `smtpHost` VARCHAR(191) NULL,
    ADD COLUMN `smtpPassword` TEXT NULL,
    ADD COLUMN `smtpPort` INTEGER NULL,
    ADD COLUMN `smtpUser` VARCHAR(191) NULL;
