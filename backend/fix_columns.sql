-- Force remove CHECK constraints by modifying the column type explicitly
ALTER TABLE vendors MODIFY COLUMN business_address LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
ALTER TABLE vendors MODIFY COLUMN payout_settings LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
