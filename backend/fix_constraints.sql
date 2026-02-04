-- Try to drop the problematic CHECK constraint
ALTER TABLE vendors DROP CHECK `vendors.business_address`;
ALTER TABLE vendors DROP CONSTRAINT `vendors.business_address`;
