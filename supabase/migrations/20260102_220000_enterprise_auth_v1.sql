-- ================================================================================================
-- 🚀 ENTERPRISE AUTH GOVERNANCE & PROFILE ENGINE (V1.0)
-- ================================================================================================
-- Focus: Zero-Trust Security, Soft Deletes, Audit Transparency, and Event-Driven Logic.
-- ================================================================================================

BEGIN;

-- ================================================================================================
-- 1. SCHEMA EVOLUTION: SOFT DELETE ARCHITECTURE
-- ================================================================================================

-- Add deleted_at to core tables for soft-delete support
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create product_variants if missing (standardizing naming)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    color TEXT,
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Ensure indexes for soft-delete filtering
CREATE INDEX IF NOT EXISTS idx_profiles_not_deleted ON public.profiles (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_not_deleted ON public.products (id) WHERE deleted_at IS NULL;

-- ================================================================================================
-- 2. ZERO-TRUST ROLE GUARD & PROFILE NORMALIZER
-- ================================================================================================

-- 2.1 Unified Handler for New Users
CREATE OR REPLACE FUNCTION public.handle_enterprise_user_init()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_avatar_url TEXT;
BEGIN
    -- STEP A: Security Guard - Force 'user' role regardless of metadata
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- STEP B: Extract Metadata for Profile
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

    -- STEP C: Create/Update Profile (Idempotent Account Resolution)
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url,
        status,
        verification_status
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        v_avatar_url,
        'active',
        'pending'
    )
    ON CONFLICT (id) DO UPDATE SET
        -- Only update metadata if it was previously empty (First Login Only Rule)
        full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
        email = COALESCE(profiles.email, EXCLUDED.email);

    -- STEP D: Audit Log Entry
    INSERT INTO public.audit_logs (actor_id, target_id, target_type, action_type, description)
    VALUES (NULL, NEW.id::text, 'user', 'account_creation', 'Enterprise account initialized via ' || COALESCE(NEW.raw_app_meta_data->>'provider', 'email'));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2 Re-attach Unified Trigger
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_enterprise_init ON auth.users;

CREATE TRIGGER on_auth_user_enterprise_init
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_enterprise_user_init();

-- ================================================================================================
-- 3. ADMINISTRATIVE BOUNDARY & EVENT HOOKS
-- ================================================================================================

-- 3.1 Event Hook: Seller Suspension -> Mass Unlisting
CREATE OR REPLACE FUNCTION public.on_seller_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If seller is suspended, automatically unpublish their products
    IF NEW.status = 'suspended' AND (OLD.status IS NULL OR OLD.status != 'suspended') THEN
        UPDATE public.products 
        SET published = false 
        WHERE seller_id = NEW.id;
        
        -- Log the mass action
        INSERT INTO public.audit_logs (actor_id, target_id, target_type, action_type, description, severity)
        VALUES (auth.uid(), NEW.id::text, 'system', 'mass_unlisting', 'Automated product unlisting due to seller suspension', 'warning');
    END IF;
    
    -- Audit trail for status change
    IF NEW.status != OLD.status THEN
        INSERT INTO public.audit_logs (actor_id, target_id, target_type, action_type, description)
        VALUES (auth.uid(), NEW.id::text, 'user', 'status_change', 'Status changed from ' || OLD.status || ' to ' || NEW.status);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_seller_status_change ON public.profiles;
CREATE TRIGGER trg_on_seller_status_change
    AFTER UPDATE OF status ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.on_seller_status_change();

-- 3.2 Audit Hook: Role Changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (actor_id, target_id, target_type, action_type, description, severity)
    VALUES (
        auth.uid(), 
        NEW.user_id::text, 
        'user', 
        'role_change', 
        'User role modified to ' || NEW.role,
        'critical'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_role_change ON public.user_roles;
CREATE TRIGGER trg_audit_role_change
    AFTER INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_change();

-- ================================================================================================
-- 4. HARDENED RLS POLICIES (FORCE SOFT-DELETE FILTERING)
-- ================================================================================================

-- profiles
DROP POLICY IF EXISTS "Public Profile Read" ON public.profiles;
CREATE POLICY "Public Profile Read" ON public.profiles 
FOR SELECT USING (deleted_at IS NULL);

-- products
DROP POLICY IF EXISTS "Public Read Published Products" ON public.products;
CREATE POLICY "Public Read Published Products" ON public.products 
FOR SELECT USING (published = true AND deleted_at IS NULL);

-- ================================================================================================
-- 5. DATA INTEGRITY BACKFILL
-- ================================================================================================

-- Ensure all existing users have a 'user' role record
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;

-- VERIFICATION
SELECT 
    '⭐⭐⭐⭐⭐ ENTERPRISE GOVERNANCE DEPLOYED' as status,
    (SELECT COUNT(*) FROM public.user_roles) as total_role_records,
    (SELECT COUNT(*) FROM public.audit_logs) as total_audit_entries;
