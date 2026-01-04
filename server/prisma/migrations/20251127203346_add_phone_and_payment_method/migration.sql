-- AlterTable
ALTER TABLE `user` ADD COLUMN `paymentDetails` TEXT NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NULL;
