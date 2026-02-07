/*
  Warnings:

  - You are about to drop the column `addressLine1` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `addressLine2` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `adminId` on the `admin_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `performedBy` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_intent_id` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `paymentStatus` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(2))`.
  - You are about to drop the column `isDefault` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `last4` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `payment_methods` table. All the data in the column will be lost.
  - The values [FAILED] on the enum `payouts_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `display_order` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `is_primary` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `colorHex` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `colorName` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `discount_price` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isBlocked` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `reviews_count` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sold_count` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `views_count` on the `products` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `VarChar(191)`.
  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `auth_provider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profile_image` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verification_token` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `bank_account` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `business_registration_number` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `gst` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `ifsc` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `pan` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `postal_code` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `vendors` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `vendors` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `VarChar(191)`.
  - A unique constraint covering the columns `[admin_id]` on the table `admin_permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_name]` on the table `vendors` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address_line1` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_id` to the `admin_permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `product_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `product_variants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `product_variants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `products` table without a default value. This is not possible if the table is not empty.
  - Made the column `vendor_id` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `addresses` DROP FOREIGN KEY `addresses_userId_fkey`;

-- DropForeignKey
ALTER TABLE `admin_permissions` DROP FOREIGN KEY `admin_permissions_adminId_fkey`;

-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_performedBy_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `payment_methods` DROP FOREIGN KEY `payment_methods_userId_fkey`;

-- DropForeignKey
ALTER TABLE `product_variants` DROP FOREIGN KEY `product_variants_productId_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_vendor_id_fkey`;

-- DropIndex
DROP INDEX `admin_permissions_adminId_key` ON `admin_permissions`;

-- AlterTable
ALTER TABLE `addresses` DROP COLUMN `addressLine1`,
    DROP COLUMN `addressLine2`,
    DROP COLUMN `country`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `fullName`,
    DROP COLUMN `isDefault`,
    DROP COLUMN `label`,
    DROP COLUMN `phone`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `userId`,
    ADD COLUMN `address_line1` VARCHAR(191) NOT NULL,
    ADD COLUMN `address_line2` VARCHAR(191) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_default` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `phone_number` VARCHAR(191) NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'HOME',
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `user_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `admin_permissions` DROP COLUMN `adminId`,
    ADD COLUMN `admin_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `canApprovePayouts` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canApproveProducts` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canCancelAnyOrder` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canChangeSettings` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canChangeUserRoles` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canDeleteAnyProduct` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canEditAnyProduct` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canIssueRefunds` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canManageAdmins` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canManageCategories` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canModifyCommission` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canSuspendUsers` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canVerifyVendors` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canViewAllOrders` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canViewFinancials` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `audit_logs` DROP COLUMN `performedBy`,
    ADD COLUMN `ip_address` VARCHAR(191) NULL,
    ADD COLUMN `performed_by` VARCHAR(191) NULL,
    ADD COLUMN `performer_email` VARCHAR(191) NULL,
    ADD COLUMN `performer_role` ENUM('SUPER_ADMIN', 'ADMIN', 'SELLER', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    ADD COLUMN `reason` VARCHAR(191) NULL,
    ADD COLUMN `user_agent` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `categories` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `description` LONGTEXT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `combo_offers` ADD COLUMN `discount_percentage` INTEGER NULL,
    ADD COLUMN `image_url` VARCHAR(191) NULL,
    MODIFY `description` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `link` VARCHAR(191) NULL,
    ADD COLUMN `metadata` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `order_status_history` MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL,
    MODIFY `notes` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `stripe_intent_id`,
    ADD COLUMN `buyer_gstin` VARCHAR(191) NULL,
    ADD COLUMN `cgst` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `customer_email` VARCHAR(191) NULL,
    ADD COLUMN `customer_name` VARCHAR(191) NULL,
    ADD COLUMN `customer_phone` VARCHAR(191) NULL,
    ADD COLUMN `delivery_otp` VARCHAR(191) NULL,
    ADD COLUMN `gst_amount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `igst` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `otp_expires_at` DATETIME(3) NULL,
    ADD COLUMN `paid_at` DATETIME(3) NULL,
    ADD COLUMN `payment_failure_reason` ENUM('NONE', 'EXPIRED_CARD', 'INSUFFICIENT_FUNDS', 'AUTHENTICATION_REQUIRED', 'DECLINED', 'NETWORK_ERROR', 'FRAUD_SUSPECTED', 'INVALID_CARD', 'CARD_NOT_SUPPORTED') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `payment_intent_id` VARCHAR(191) NULL,
    ADD COLUMN `refunded_at` DATETIME(3) NULL,
    ADD COLUMN `sgst` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `shipping_fee` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `tax_amount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1,
    MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    MODIFY `paymentStatus` ENUM('UNPAID', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'UNPAID',
    MODIFY `customer_id` VARCHAR(191) NULL,
    MODIFY `notes` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `payment_methods` DROP COLUMN `isDefault`,
    DROP COLUMN `last4`,
    DROP COLUMN `provider`,
    DROP COLUMN `userId`,
    ADD COLUMN `card_brand` VARCHAR(191) NULL,
    ADD COLUMN `card_exp_month` INTEGER NULL,
    ADD COLUMN `card_exp_year` INTEGER NULL,
    ADD COLUMN `card_holder_name` VARCHAR(191) NULL,
    ADD COLUMN `card_last_4` VARCHAR(191) NULL,
    ADD COLUMN `details` LONGTEXT NULL,
    ADD COLUMN `is_default` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `label` VARCHAR(191) NULL,
    ADD COLUMN `user_id` VARCHAR(191) NOT NULL,
    MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'card';

-- AlterTable
ALTER TABLE `payouts` ADD COLUMN `rejection_reason` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'PROCESSING', 'PAID', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `product_images` DROP COLUMN `display_order`,
    DROP COLUMN `image_url`,
    DROP COLUMN `is_primary`,
    ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `url` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `product_reviews` ADD COLUMN `images` LONGTEXT NULL,
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `metadata` LONGTEXT NULL,
    ADD COLUMN `title` VARCHAR(191) NULL,
    MODIFY `comment` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `product_variants` DROP COLUMN `colorHex`,
    DROP COLUMN `colorName`,
    DROP COLUMN `productId`,
    ADD COLUMN `color_hex` VARCHAR(191) NULL,
    ADD COLUMN `color_name` VARCHAR(191) NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `price` DOUBLE NULL,
    ADD COLUMN `product_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `stock` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `categoryId`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `deletedAt`,
    DROP COLUMN `discount_price`,
    DROP COLUMN `isBlocked`,
    DROP COLUMN `isVerified`,
    DROP COLUMN `published`,
    DROP COLUMN `reviews_count`,
    DROP COLUMN `sold_count`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `views_count`,
    ADD COLUMN `blocked_reason` VARCHAR(191) NULL,
    ADD COLUMN `category_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `commission_rate` DOUBLE NULL,
    ADD COLUMN `compare_at_price` DOUBLE NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `gst_rate` DOUBLE NOT NULL DEFAULT 18,
    ADD COLUMN `hsn_code` VARCHAR(191) NULL,
    ADD COLUMN `is_blocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `last_stock_alert` DATETIME(3) NULL,
    ADD COLUMN `low_stock_threshold` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `review_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `tags` VARCHAR(191) NULL,
    ADD COLUMN `tax_inclusive` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `verified_at` DATETIME(3) NULL,
    ADD COLUMN `verified_by` VARCHAR(191) NULL,
    MODIFY `description` LONGTEXT NOT NULL,
    MODIFY `admin_notes` LONGTEXT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    MODIFY `vendor_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `auto_confirm_orders` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `banner_url` VARCHAR(191) NULL,
    ADD COLUMN `logo_url` VARCHAR(191) NULL,
    ADD COLUMN `maintenance_mode` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notification_settings` LONGTEXT NULL,
    ADD COLUMN `shipping_fee` DOUBLE NOT NULL DEFAULT 99,
    ADD COLUMN `store_url` VARCHAR(191) NOT NULL DEFAULT 'https://pravokha.com',
    ADD COLUMN `system_settings` LONGTEXT NULL,
    ADD COLUMN `tax_rate` DOUBLE NOT NULL DEFAULT 18;

-- AlterTable
ALTER TABLE `support_messages` MODIFY `message` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `support_tickets` ADD COLUMN `evidence_urls` LONGTEXT NULL,
    ADD COLUMN `is_suspended_seller` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `description` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `ticket_messages` ADD COLUMN `is_internal` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `message` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `user_preferences` ADD COLUMN `marketing_emails` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `order_updates` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `address`,
    DROP COLUMN `auth_provider`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `dateOfBirth`,
    DROP COLUMN `email_verified`,
    DROP COLUMN `last_login`,
    DROP COLUMN `phone`,
    DROP COLUMN `profile_image`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `vendor_id`,
    DROP COLUMN `verification_token`,
    ADD COLUMN `avatar_url` VARCHAR(191) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `date_of_birth` DATETIME(3) NULL,
    ADD COLUMN `phone_number` VARCHAR(191) NULL,
    ADD COLUMN `suspended_at` DATETIME(3) NULL,
    ADD COLUMN `suspended_by` VARCHAR(191) NULL,
    ADD COLUMN `suspension_expires_at` DATETIME(3) NULL,
    ADD COLUMN `suspension_reason` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `verification_status` VARCHAR(191) NOT NULL DEFAULT 'unverified',
    MODIFY `name` VARCHAR(191) NOT NULL,
    MODIFY `bio` LONGTEXT NULL,
    MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'SELLER', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE `vendors` DROP COLUMN `address`,
    DROP COLUMN `bank_account`,
    DROP COLUMN `business_registration_number`,
    DROP COLUMN `city`,
    DROP COLUMN `country`,
    DROP COLUMN `email`,
    DROP COLUMN `gst`,
    DROP COLUMN `ifsc`,
    DROP COLUMN `pan`,
    DROP COLUMN `phone`,
    DROP COLUMN `postal_code`,
    DROP COLUMN `state`,
    ADD COLUMN `auto_confirm` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `bank_account_name` VARCHAR(191) NULL,
    ADD COLUMN `bank_account_number` VARCHAR(191) NULL,
    ADD COLUMN `bank_ifsc_code` VARCHAR(191) NULL,
    ADD COLUMN `bank_name` VARCHAR(191) NULL,
    ADD COLUMN `business_address` LONGTEXT NULL,
    ADD COLUMN `gst_number` VARCHAR(191) NULL,
    ADD COLUMN `meta_description` LONGTEXT NULL,
    ADD COLUMN `meta_title` VARCHAR(191) NULL,
    ADD COLUMN `pan_number` VARCHAR(191) NULL,
    ADD COLUMN `payout_settings` LONGTEXT NULL,
    ADD COLUMN `return_policy` LONGTEXT NULL,
    ADD COLUMN `review_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `support_email` VARCHAR(191) NULL,
    ADD COLUMN `support_phone` VARCHAR(191) NULL,
    ADD COLUMN `vacation_mode` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `description` LONGTEXT NULL,
    MODIFY `commission_rate` DOUBLE NOT NULL DEFAULT 10,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `product_update_requests` (
    `id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `seller_id` VARCHAR(191) NOT NULL,
    `requested_changes` LONGTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `admin_notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_update_requests_product_id_fkey`(`product_id`),
    INDEX `product_update_requests_seller_id_fkey`(`seller_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NULL,
    `provider_event_id` VARCHAR(191) NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `processed_at` DATETIME(3) NULL,
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `error_message` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `webhook_events_provider_event_id_key`(`provider_event_id`),
    INDEX `webhook_events_provider_event_id_idx`(`provider_event_id`),
    INDEX `webhook_events_processed_idx`(`processed`),
    INDEX `webhook_events_event_type_idx`(`event_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `razorpay_order_id` VARCHAR(191) NULL,
    `razorpay_payment_id` VARCHAR(191) NULL,
    `razorpay_signature` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` ENUM('CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'CREATED',
    `payment_method` VARCHAR(191) NULL,
    `payment_method_details` LONGTEXT NULL,
    `error_code` VARCHAR(191) NULL,
    `error_description` VARCHAR(191) NULL,
    `failure_reason` VARCHAR(191) NULL,
    `refund_id` VARCHAR(191) NULL,
    `refund_amount` DOUBLE NULL,
    `refund_status` VARCHAR(191) NULL,
    `metadata` LONGTEXT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `last_attempt_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_transactions_razorpay_order_id_key`(`razorpay_order_id`),
    UNIQUE INDEX `payment_transactions_razorpay_payment_id_key`(`razorpay_payment_id`),
    INDEX `payment_transactions_razorpay_order_id_idx`(`razorpay_order_id`),
    INDEX `payment_transactions_razorpay_payment_id_idx`(`razorpay_payment_id`),
    INDEX `payment_transactions_order_id_idx`(`order_id`),
    INDEX `payment_transactions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_logs` (
    `id` VARCHAR(191) NOT NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `template` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `sent_at` DATETIME(3) NULL,
    `error_message` LONGTEXT NULL,
    `metadata` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `return_requests` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `customer_id` VARCHAR(191) NOT NULL,
    `reason` LONGTEXT NOT NULL,
    `status` ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'REFUNDED') NOT NULL DEFAULT 'REQUESTED',
    `images` LONGTEXT NULL,
    `refund_amount` DOUBLE NOT NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `rejected_reason` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipments` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `shiprocket_order_id` INTEGER NULL,
    `awb` VARCHAR(191) NULL,
    `courier_name` VARCHAR(191) NULL,
    `tracking_url` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `pickup_scheduled` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `vendor_id` VARCHAR(191) NOT NULL,
    `current_stock` INTEGER NOT NULL,
    `threshold` INTEGER NOT NULL,
    `notified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `addresses_user_id_fkey` ON `addresses`(`user_id`);

-- CreateIndex
CREATE UNIQUE INDEX `admin_permissions_admin_id_key` ON `admin_permissions`(`admin_id`);

-- CreateIndex
CREATE INDEX `audit_logs_performed_by_fkey` ON `audit_logs`(`performed_by`);

-- CreateIndex
CREATE INDEX `payment_methods_user_id_fkey` ON `payment_methods`(`user_id`);

-- CreateIndex
CREATE UNIQUE INDEX `product_variants_sku_key` ON `product_variants`(`sku`);

-- CreateIndex
CREATE INDEX `product_variants_product_id_fkey` ON `product_variants`(`product_id`);

-- CreateIndex
CREATE INDEX `products_category_id_fkey` ON `products`(`category_id`);

-- CreateIndex
CREATE UNIQUE INDEX `users_google_id_key` ON `users`(`google_id`);

-- CreateIndex
CREATE UNIQUE INDEX `vendors_store_name_key` ON `vendors`(`store_name`);

-- AddForeignKey
ALTER TABLE `admin_permissions` ADD CONSTRAINT `admin_permissions_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_update_requests` ADD CONSTRAINT `product_update_requests_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_update_requests` ADD CONSTRAINT `product_update_requests_seller_id_fkey` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `return_requests` ADD CONSTRAINT `return_requests_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `return_requests` ADD CONSTRAINT `return_requests_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_alerts` ADD CONSTRAINT `stock_alerts_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_alerts` ADD CONSTRAINT `stock_alerts_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
