-- ================================================================================================
-- 🚀 SCHEMA FIX: MISSING COLUMNS RECOVERY
-- ================================================================================================

BEGIN;

-- 1. FIX PROFILES TABLE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. FIX ORDERS TABLE
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_pincode TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_updates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- ENSURE SHIPPING ADDRESS IS COMPATIBLE (Some code expects TEXT, SQL had JSONB)
-- If we want to change it to TEXT, we should check if data exists. 
-- For safety, we'll keep it as JSONB if it exists, or add it as TEXT if not.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_address') THEN
        -- If it exists, we keep it as is to avoid data loss, but ensure the app handles it.
        NULL;
    ELSE
        ALTER TABLE public.orders ADD COLUMN shipping_address TEXT;
    END IF;
END $$;

COMMIT;

SELECT '✅ DB SCHEMA SYNCHRONIZED' as status;
