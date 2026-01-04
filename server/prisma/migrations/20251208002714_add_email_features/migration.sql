-- AlterTable
ALTER TABLE `email` ADD COLUMN `folderId` INTEGER NULL,
    ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isDraft` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isImportant` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isSpam` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isStarred` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `labels` TEXT NULL,
    ADD COLUMN `scheduledFor` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Email_isStarred_idx` ON `Email`(`isStarred`);

-- CreateIndex
CREATE INDEX `Email_isArchived_idx` ON `Email`(`isArchived`);

-- CreateIndex
CREATE INDEX `Email_isSpam_idx` ON `Email`(`isSpam`);

-- CreateIndex
CREATE INDEX `Email_isImportant_idx` ON `Email`(`isImportant`);

-- CreateIndex
CREATE INDEX `Email_isDraft_idx` ON `Email`(`isDraft`);

-- CreateIndex
CREATE INDEX `Email_isDeleted_idx` ON `Email`(`isDeleted`);

-- CreateIndex
CREATE INDEX `Email_folderId_idx` ON `Email`(`folderId`);
