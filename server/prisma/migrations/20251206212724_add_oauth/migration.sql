-- CreateTable
CREATE TABLE `OAuthApplication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `clientSecret` VARCHAR(191) NOT NULL,
    `redirectUris` TEXT NOT NULL,
    `userId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OAuthApplication_clientId_key`(`clientId`),
    INDEX `OAuthApplication_clientId_idx`(`clientId`),
    INDEX `OAuthApplication_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OAuthAuthCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `applicationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `redirectUri` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OAuthAuthCode_code_key`(`code`),
    INDEX `OAuthAuthCode_code_idx`(`code`),
    INDEX `OAuthAuthCode_applicationId_idx`(`applicationId`),
    INDEX `OAuthAuthCode_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OAuthAccessToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(191) NOT NULL,
    `refreshToken` VARCHAR(191) NULL,
    `applicationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `scope` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OAuthAccessToken_token_key`(`token`),
    UNIQUE INDEX `OAuthAccessToken_refreshToken_key`(`refreshToken`),
    INDEX `OAuthAccessToken_token_idx`(`token`),
    INDEX `OAuthAccessToken_refreshToken_idx`(`refreshToken`),
    INDEX `OAuthAccessToken_applicationId_idx`(`applicationId`),
    INDEX `OAuthAccessToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OAuthApplication` ADD CONSTRAINT `OAuthApplication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthAuthCode` ADD CONSTRAINT `OAuthAuthCode_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `OAuthApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthAuthCode` ADD CONSTRAINT `OAuthAuthCode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthAccessToken` ADD CONSTRAINT `OAuthAccessToken_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `OAuthApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthAccessToken` ADD CONSTRAINT `OAuthAccessToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
