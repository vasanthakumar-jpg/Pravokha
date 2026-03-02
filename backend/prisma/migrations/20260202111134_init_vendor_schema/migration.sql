/*
  Warnings:

  - You are about to drop the column `canApprovePayouts` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canApproveProducts` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canCancelAnyOrder` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canChangeSettings` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canChangeUserRoles` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canDeleteAnyProduct` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canEditAnyProduct` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canIssueRefunds` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canManageAdmins` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canManageCategories` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canModifyCommission` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canSuspendUsers` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canVerifyDealers` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canViewAllOrders` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `canViewFinancials` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `performerEmail` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `performerRole` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `displayOrder` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `discount_percentage` on the `combo_offers` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `combo_offers` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `combo_offers` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `delivered_at` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `platform_commission` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `seller_earning` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `seller_id` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `shipped_at` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `tracking_carrier` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `tracking_number` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `order_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `commission_amount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `customerEmail` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderNumber` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `packing_notes` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paid_at` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `refundAmount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `refundReason` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `refunded_at` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `seller_earnings` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shipped_by_seller_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddress` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCity` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shippingPincode` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `stripeIntentId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `tracking_updates` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `cardBrand` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `cardExpMonth` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `cardExpYear` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `cardHolderName` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `cardLast4` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `period_end` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `period_start` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `rejection_reason` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `seller_id` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `product_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `product_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `product_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `adminNotes` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `blockedReason` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `commissionRate` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `dealerId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `discountPrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isNew` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `lastEditedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `lastEditedBy` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `reviews` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `subcategoryId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `ai_insights_enabled` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `analytics_enabled` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `auto_confirm_orders` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `banner_url` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `data_anonymization_enabled` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `logo_url` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `maintenance_mode` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `payout_automation_enabled` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `public_indexing_enabled` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `session_tracking_enabled` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `store_url` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `is_admin` on the `support_messages` table. All the data in the column will be lost.
  - You are about to drop the column `evidenceUrls` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `is_high_priority` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `suspended_seller` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `is_internal` on the `ticket_messages` table. All the data in the column will be lost.
  - You are about to drop the column `is_read` on the `ticket_messages` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `marketingEmails` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `orderUpdates` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `smsNotifications` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorAuth` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `autoConfirm` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccount` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `beneficiaryName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `gst` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `ifsc` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `metaDescription` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `metaTitle` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `pan` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `returnPolicy` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `storeBannerUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `storeDescription` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `storeLogoUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `storeName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `suspendedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `suspendedBy` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `suspensionExpiresAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `suspensionReason` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vacationMode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationComments` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(0))`.
  - You are about to drop the `admin_notification_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `migration_audit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_update_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subcategories` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[order_number]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price_at_purchase` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_number` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_method` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipping_address` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor_id` to the `payouts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `admin_notification_settings` DROP FOREIGN KEY `admin_notification_settings_admin_id_fkey`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_seller_id_fkey`;

-- DropForeignKey
ALTER TABLE `order_status_history` DROP FOREIGN KEY `order_status_history_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_shipped_by_seller_id_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_userId_fkey`;

-- DropForeignKey
ALTER TABLE `payouts` DROP FOREIGN KEY `payouts_seller_id_fkey`;

-- DropForeignKey
ALTER TABLE `product_update_requests` DROP FOREIGN KEY `product_update_requests_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `product_update_requests` DROP FOREIGN KEY `product_update_requests_seller_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_dealerId_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_subcategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `subcategories` DROP FOREIGN KEY `subcategories_categoryId_fkey`;

-- DropIndex
DROP INDEX `audit_logs_action_idx` ON `audit_logs`;

-- DropIndex
DROP INDEX `audit_logs_createdAt_idx` ON `audit_logs`;

-- DropIndex
DROP INDEX `audit_logs_entityId_idx` ON `audit_logs`;

-- DropIndex
DROP INDEX `orders_orderNumber_key` ON `orders`;

-- DropIndex
DROP INDEX `orders_stripeIntentId_key` ON `orders`;

-- DropIndex
DROP INDEX `users_google_id_key` ON `users`;

-- AlterTable
ALTER TABLE `addresses` ADD COLUMN `country` VARCHAR(191) NOT NULL DEFAULT 'India';

-- AlterTable
ALTER TABLE `admin_permissions` DROP COLUMN `canApprovePayouts`,
    DROP COLUMN `canApproveProducts`,
    DROP COLUMN `canCancelAnyOrder`,
    DROP COLUMN `canChangeSettings`,
    DROP COLUMN `canChangeUserRoles`,
    DROP COLUMN `canDeleteAnyProduct`,
    DROP COLUMN `canEditAnyProduct`,
    DROP COLUMN `canIssueRefunds`,
    DROP COLUMN `canManageAdmins`,
    DROP COLUMN `canManageCategories`,
    DROP COLUMN `canModifyCommission`,
    DROP COLUMN `canSuspendUsers`,
    DROP COLUMN `canVerifyDealers`,
    DROP COLUMN `canViewAllOrders`,
    DROP COLUMN `canViewFinancials`,
    ADD COLUMN `canManageFinancials` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canManagePlatform` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canManageVendors` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `audit_logs` DROP COLUMN `ipAddress`,
    DROP COLUMN `performerEmail`,
    DROP COLUMN `performerRole`,
    DROP COLUMN `reason`,
    DROP COLUMN `userAgent`;

-- AlterTable
ALTER TABLE `categories` DROP COLUMN `description`,
    DROP COLUMN `displayOrder`,
    DROP COLUMN `imageUrl`,
    ADD COLUMN `display_order` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `image_url` VARCHAR(191) NULL,
    ADD COLUMN `parent_id` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `combo_offers` DROP COLUMN `discount_percentage`,
    DROP COLUMN `image_url`,
    DROP COLUMN `updated_at`;

-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `link`,
    DROP COLUMN `metadata`;

-- AlterTable
ALTER TABLE `order_items` DROP COLUMN `delivered_at`,
    DROP COLUMN `platform_commission`,
    DROP COLUMN `price`,
    DROP COLUMN `seller_earning`,
    DROP COLUMN `seller_id`,
    DROP COLUMN `shipped_at`,
    DROP COLUMN `status`,
    DROP COLUMN `title`,
    DROP COLUMN `tracking_carrier`,
    DROP COLUMN `tracking_number`,
    ADD COLUMN `price_at_purchase` DOUBLE NOT NULL,
    ADD COLUMN `subtotal` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `order_status_history` DROP COLUMN `user_id`;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `commission_amount`,
    DROP COLUMN `customerEmail`,
    DROP COLUMN `customerName`,
    DROP COLUMN `customerPhone`,
    DROP COLUMN `orderNumber`,
    DROP COLUMN `packing_notes`,
    DROP COLUMN `paid_at`,
    DROP COLUMN `paymentMethod`,
    DROP COLUMN `refundAmount`,
    DROP COLUMN `refundReason`,
    DROP COLUMN `refunded_at`,
    DROP COLUMN `seller_earnings`,
    DROP COLUMN `shipped_by_seller_id`,
    DROP COLUMN `shippingAddress`,
    DROP COLUMN `shippingCity`,
    DROP COLUMN `shippingPincode`,
    DROP COLUMN `stripeIntentId`,
    DROP COLUMN `total`,
    DROP COLUMN `tracking_updates`,
    DROP COLUMN `userId`,
    DROP COLUMN `version`,
    ADD COLUMN `customer_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `order_number` VARCHAR(191) NOT NULL,
    ADD COLUMN `payment_method` VARCHAR(191) NOT NULL,
    ADD COLUMN `platform_fee` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `refund_reason` VARCHAR(191) NULL,
    ADD COLUMN `refunded_amount` DOUBLE NULL,
    ADD COLUMN `shipping_address` JSON NOT NULL,
    ADD COLUMN `stripe_intent_id` VARCHAR(191) NULL,
    ADD COLUMN `total_amount` DOUBLE NOT NULL,
    ADD COLUMN `vendor_earnings` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `vendor_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `payment_methods` DROP COLUMN `cardBrand`,
    DROP COLUMN `cardExpMonth`,
    DROP COLUMN `cardExpYear`,
    DROP COLUMN `cardHolderName`,
    DROP COLUMN `cardLast4`,
    DROP COLUMN `details`,
    DROP COLUMN `label`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `last4` VARCHAR(191) NULL,
    ADD COLUMN `provider` VARCHAR(191) NOT NULL,
    ALTER COLUMN `type` DROP DEFAULT;

-- AlterTable
ALTER TABLE `payouts` DROP COLUMN `period_end`,
    DROP COLUMN `period_start`,
    DROP COLUMN `rejection_reason`,
    DROP COLUMN `seller_id`,
    ADD COLUMN `paid_at` DATETIME(3) NULL,
    ADD COLUMN `user_id` VARCHAR(191) NULL,
    ADD COLUMN `vendor_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `product_reviews` DROP COLUMN `images`,
    DROP COLUMN `title`,
    DROP COLUMN `updated_at`,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'published';

-- AlterTable
ALTER TABLE `products` DROP COLUMN `adminNotes`,
    DROP COLUMN `blockedReason`,
    DROP COLUMN `commissionRate`,
    DROP COLUMN `dealerId`,
    DROP COLUMN `discountPrice`,
    DROP COLUMN `isFeatured`,
    DROP COLUMN `isNew`,
    DROP COLUMN `lastEditedAt`,
    DROP COLUMN `lastEditedBy`,
    DROP COLUMN `reviews`,
    DROP COLUMN `subcategoryId`,
    DROP COLUMN `verifiedAt`,
    DROP COLUMN `verifiedBy`,
    ADD COLUMN `admin_notes` TEXT NULL,
    ADD COLUMN `discount_price` DOUBLE NULL,
    ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reviews_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `sold_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `status` ENUM('DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `vendor_id` VARCHAR(191) NULL,
    ADD COLUMN `views_count` INTEGER NOT NULL DEFAULT 0,
    MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `site_settings` DROP COLUMN `ai_insights_enabled`,
    DROP COLUMN `analytics_enabled`,
    DROP COLUMN `auto_confirm_orders`,
    DROP COLUMN `banner_url`,
    DROP COLUMN `currency`,
    DROP COLUMN `data_anonymization_enabled`,
    DROP COLUMN `logo_url`,
    DROP COLUMN `maintenance_mode`,
    DROP COLUMN `payout_automation_enabled`,
    DROP COLUMN `public_indexing_enabled`,
    DROP COLUMN `session_tracking_enabled`,
    DROP COLUMN `store_url`,
    DROP COLUMN `timezone`,
    ADD COLUMN `commission_rate` DOUBLE NOT NULL DEFAULT 10.0;

-- AlterTable
ALTER TABLE `support_messages` DROP COLUMN `is_admin`,
    ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `support_tickets` DROP COLUMN `evidenceUrls`,
    DROP COLUMN `is_high_priority`,
    DROP COLUMN `suspended_seller`;

-- AlterTable
ALTER TABLE `ticket_messages` DROP COLUMN `is_internal`,
    DROP COLUMN `is_read`,
    ADD COLUMN `isRead` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `user_preferences` DROP COLUMN `currency`,
    DROP COLUMN `language`,
    DROP COLUMN `marketingEmails`,
    DROP COLUMN `orderUpdates`,
    DROP COLUMN `smsNotifications`,
    DROP COLUMN `theme`,
    DROP COLUMN `twoFactorAuth`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `autoConfirm`,
    DROP COLUMN `avatarUrl`,
    DROP COLUMN `bankAccount`,
    DROP COLUMN `beneficiaryName`,
    DROP COLUMN `gst`,
    DROP COLUMN `ifsc`,
    DROP COLUMN `metaDescription`,
    DROP COLUMN `metaTitle`,
    DROP COLUMN `pan`,
    DROP COLUMN `returnPolicy`,
    DROP COLUMN `storeBannerUrl`,
    DROP COLUMN `storeDescription`,
    DROP COLUMN `storeLogoUrl`,
    DROP COLUMN `storeName`,
    DROP COLUMN `suspendedAt`,
    DROP COLUMN `suspendedBy`,
    DROP COLUMN `suspensionExpiresAt`,
    DROP COLUMN `suspensionReason`,
    DROP COLUMN `vacationMode`,
    DROP COLUMN `verificationComments`,
    DROP COLUMN `verificationStatus`,
    ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `last_login` DATETIME(3) NULL,
    ADD COLUMN `profile_image` VARCHAR(191) NULL,
    ADD COLUMN `vendor_id` VARCHAR(191) NULL,
    ADD COLUMN `verification_token` VARCHAR(191) NULL,
    MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER';

-- DropTable
DROP TABLE `admin_notification_settings`;

-- DropTable
DROP TABLE `migration_audit`;

-- DropTable
DROP TABLE `product_update_requests`;

-- DropTable
DROP TABLE `subcategories`;

-- CreateTable
CREATE TABLE `vendors` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `store_name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `logo_url` VARCHAR(191) NULL,
    `banner_url` VARCHAR(191) NULL,
    `commission_rate` DOUBLE NOT NULL DEFAULT 15.0,
    `business_registration_number` VARCHAR(191) NULL,
    `gst` VARCHAR(191) NULL,
    `pan` VARCHAR(191) NULL,
    `bank_account` VARCHAR(191) NULL,
    `ifsc` VARCHAR(191) NULL,
    `beneficiary_name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `postal_code` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `approved_at` DATETIME(3) NULL,
    `total_sales` DOUBLE NOT NULL DEFAULT 0,
    `total_orders` INTEGER NOT NULL DEFAULT 0,
    `rating` DOUBLE NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vendors_owner_id_key`(`owner_id`),
    UNIQUE INDEX `vendors_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `orders_order_number_key` ON `orders`(`order_number`);

-- AddForeignKey
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
