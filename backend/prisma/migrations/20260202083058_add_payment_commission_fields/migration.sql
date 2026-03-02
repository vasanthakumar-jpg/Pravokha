-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `delivered_at` DATETIME(3) NULL,
    ADD COLUMN `platform_commission` DOUBLE NULL,
    ADD COLUMN `seller_earning` DOUBLE NULL,
    ADD COLUMN `shipped_at` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `tracking_carrier` VARCHAR(191) NULL,
    ADD COLUMN `tracking_number` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `commission_amount` DOUBLE NULL,
    ADD COLUMN `paid_at` DATETIME(3) NULL,
    ADD COLUMN `refundAmount` DOUBLE NULL,
    ADD COLUMN `refundReason` TEXT NULL,
    ADD COLUMN `refunded_at` DATETIME(3) NULL,
    ADD COLUMN `seller_earnings` DOUBLE NULL,
    MODIFY `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING';
