-- Migration: Add seller_id to order_items table for multi-vendor order tracking
-- Date: 2026-01-22
-- CRITICAL: This migration includes a data backfill step

-- Step 1: Add the seller_id column (nullable first)
ALTER TABLE `order_items` ADD COLUMN `seller_id` VARCHAR(191) NULL;

-- Step 2: Backfill seller_id from the product's dealerId
UPDATE `order_items` oi
INNER JOIN `products` p ON oi.productId = p.id
SET oi.seller_id = p.dealerId;

-- Step 3: Verify no nulls remain (safety check)
-- If this fails, there are orphaned order items without valid products
SELECT COUNT(*) as orphaned_items FROM `order_items` WHERE `seller_id` IS NULL;

-- Step 4: Make seller_id NOT NULL
ALTER TABLE `order_items` MODIFY COLUMN `seller_id` VARCHAR(191) NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE `order_items` 
ADD CONSTRAINT `order_items_seller_id_fkey` 
FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Add index for performance
CREATE INDEX `order_items_seller_id_idx` ON `order_items`(`seller_id`);
