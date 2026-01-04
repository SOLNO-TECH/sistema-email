-- AlterTable
ALTER TABLE `domain` ADD COLUMN `dkimRecord` VARCHAR(191) NULL,
    ADD COLUMN `dmarcRecord` VARCHAR(191) NULL,
    ADD COLUMN `lastDnsCheck` DATETIME(3) NULL,
    ADD COLUMN `mxRecord` VARCHAR(191) NULL,
    ADD COLUMN `spfRecord` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Email` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `emailAccountId` INTEGER NOT NULL,
    `from` VARCHAR(191) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(500) NOT NULL,
    `body` TEXT NOT NULL,
    `htmlBody` TEXT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isSent` BOOLEAN NOT NULL DEFAULT false,
    `messageId` VARCHAR(191) NULL,
    `inReplyTo` VARCHAR(191) NULL,
    `references` TEXT NULL,
    `priority` VARCHAR(20) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentAt` DATETIME(3) NULL,

    UNIQUE INDEX `Email_messageId_key`(`messageId`),
    INDEX `Email_emailAccountId_idx`(`emailAccountId`),
    INDEX `Email_isRead_idx`(`isRead`),
    INDEX `Email_isSent_idx`(`isSent`),
    INDEX `Email_receivedAt_idx`(`receivedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `emailId` INTEGER NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `contentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Email` ADD CONSTRAINT `Email_emailAccountId_fkey` FOREIGN KEY (`emailAccountId`) REFERENCES `EmailAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailAttachment` ADD CONSTRAINT `EmailAttachment_emailId_fkey` FOREIGN KEY (`emailId`) REFERENCES `Email`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
