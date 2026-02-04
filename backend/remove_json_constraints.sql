-- Remove legacy JSON validation constraints that are blocking plain text inputs
ALTER TABLE vendors DROP CONSTRAINT `business_address`;
ALTER TABLE vendors DROP CONSTRAINT `payout_settings`;
