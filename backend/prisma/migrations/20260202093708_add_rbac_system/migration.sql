/*
  Warnings:

  - You are about to drop the column `action_type` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `actor_id` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `target_id` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `target_type` on the `audit_logs` table. All the data in the column will be lost.
  - Added the required column `action` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entity` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `performedBy` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `performerEmail` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `performerRole` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_actor_id_fkey`;

-- AlterTable
ALTER TABLE `audit_logs` DROP COLUMN `action_type`,
    DROP COLUMN `actor_id`,
    DROP COLUMN `created_at`,
    DROP COLUMN `description`,
    DROP COLUMN `metadata`,
    DROP COLUMN `severity`,
    DROP COLUMN `target_id`,
    DROP COLUMN `target_type`,
    ADD COLUMN `action` VARCHAR(191) NOT NULL,
    ADD COLUMN `changes` JSON NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `entity` VARCHAR(191) NOT NULL,
    ADD COLUMN `entityId` VARCHAR(191) NOT NULL,
    ADD COLUMN `ipAddress` VARCHAR(191) NULL,
    ADD COLUMN `performedBy` VARCHAR(191) NOT NULL,
    ADD COLUMN `performerEmail` VARCHAR(191) NOT NULL,
    ADD COLUMN `performerRole` ENUM('SUPER_ADMIN', 'ADMIN', 'DEALER', 'USER') NOT NULL,
    ADD COLUMN `reason` TEXT NULL,
    ADD COLUMN `userAgent` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `adminNotes` TEXT NULL,
    ADD COLUMN `blockedReason` VARCHAR(191) NULL,
    ADD COLUMN `commissionRate` DOUBLE NOT NULL DEFAULT 0.10,
    ADD COLUMN `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastEditedAt` DATETIME(3) NULL,
    ADD COLUMN `lastEditedBy` VARCHAR(191) NULL,
    ADD COLUMN `verifiedAt` DATETIME(3) NULL,
    ADD COLUMN `verifiedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `suspendedAt` DATETIME(3) NULL,
    ADD COLUMN `suspendedBy` VARCHAR(191) NULL,
    ADD COLUMN `suspensionExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `suspensionReason` TEXT NULL,
    MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'DEALER', 'USER') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `admin_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `canApproveProducts` BOOLEAN NOT NULL DEFAULT false,
    `canEditAnyProduct` BOOLEAN NOT NULL DEFAULT false,
    `canDeleteAnyProduct` BOOLEAN NOT NULL DEFAULT false,
    `canManageCategories` BOOLEAN NOT NULL DEFAULT false,
    `canManageUsers` BOOLEAN NOT NULL DEFAULT false,
    `canSuspendUsers` BOOLEAN NOT NULL DEFAULT false,
    `canVerifyDealers` BOOLEAN NOT NULL DEFAULT false,
    `canChangeUserRoles` BOOLEAN NOT NULL DEFAULT false,
    `canViewAllOrders` BOOLEAN NOT NULL DEFAULT false,
    `canCancelAnyOrder` BOOLEAN NOT NULL DEFAULT false,
    `canIssueRefunds` BOOLEAN NOT NULL DEFAULT false,
    `canApprovePayouts` BOOLEAN NOT NULL DEFAULT false,
    `canViewFinancials` BOOLEAN NOT NULL DEFAULT false,
    `canModifyCommission` BOOLEAN NOT NULL DEFAULT false,
    `canAccessAuditLogs` BOOLEAN NOT NULL DEFAULT false,
    `canManageAdmins` BOOLEAN NOT NULL DEFAULT false,
    `canChangeSettings` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_permissions_adminId_key`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `audit_logs_performedBy_idx` ON `audit_logs`(`performedBy`);

-- CreateIndex
CREATE INDEX `audit_logs_action_idx` ON `audit_logs`(`action`);

-- CreateIndex
CREATE INDEX `audit_logs_entityId_idx` ON `audit_logs`(`entityId`);

-- CreateIndex
CREATE INDEX `audit_logs_createdAt_idx` ON `audit_logs`(`createdAt`);

-- AddForeignKey
ALTER TABLE `admin_permissions` ADD CONSTRAINT `admin_permissions_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_performedBy_fkey` FOREIGN KEY (`performedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
