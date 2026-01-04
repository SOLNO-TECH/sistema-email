/*
  Warnings:

  - You are about to alter the column `status` on the `ticket` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `priority` on the `ticket` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE `ticket` MODIFY `subject` VARCHAR(255) NOT NULL,
    MODIFY `description` TEXT NOT NULL,
    MODIFY `status` VARCHAR(50) NOT NULL DEFAULT 'open',
    MODIFY `priority` VARCHAR(50) NOT NULL DEFAULT 'medium';
