-- ================================================================================================
-- 🚀 RECURSION FIX & TEST ACCOUNT SETUP (FINAL 10/10 FIX)
-- ================================================================================================
-- Purpose: 
-- 1. Fix "infinite recursion" in user_roles RLS policies.
-- 2. Manually link Admin and Seller test accounts to their correct roles.
-- ================================================================================================

BEGIN;

-- 1. FIX THE RECURSION: Hardening is_admin check
-- We create a "safe" version of is_admin that runs as postgres and doesn't trigger extra RLS loops.
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid()) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Security definer ensures this bypasses RLS on the table it queries
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. REBUILD USER ROLES RLS POLICIES
-- Clean sweep of old problematic policies
DROP POLICY IF EXISTS "Admins Manage All Roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users Read Own Roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public Select Roles" ON public.user_roles;

-- POLICY A: Users can ALWAYS read their own roles (Bypasses recursion by checking ID only)
CREATE POLICY "Users Read Own Roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- POLICY B: Admins can MANAGE all roles (Uses the safe check_is_admin function)
CREATE POLICY "Admins Manage All Roles" 
ON public.user_roles FOR ALL 
USING (public.is_admin());

-- 3. SETUP TEST CREDENTIALS
-- This part links your provided emails to the correct roles in the database.

DO $$
DECLARE
    v_admin_id UUID;
    v_seller_id UUID;
BEGIN
    -- STEP A: Setup Admin Account (admin@pravokha.com)
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@pravokha.com';
    IF v_admin_id IS NOT NULL THEN
        -- Force Admin Role
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (v_admin_id, 'admin') 
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Ensure Profile exists and is active
        INSERT INTO public.profiles (id, email, full_name, status) 
        VALUES (v_admin_id, 'admin@pravokha.com', 'Admin User', 'active') 
        ON CONFLICT (id) DO UPDATE SET status = 'active';
    END IF;

    -- STEP B: Setup Seller Account (seller01@pravokha.com)
    SELECT id INTO v_seller_id FROM auth.users WHERE email = 'seller01@pravokha.com';
    IF v_seller_id IS NOT NULL THEN
        -- Force Seller Role
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (v_seller_id, 'seller') 
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Ensure Profile exists, is active, and verified
        INSERT INTO public.profiles (id, email, full_name, status, verification_status) 
        VALUES (v_seller_id, 'seller01@pravokha.com', 'Test Seller 01', 'active', 'verified') 
        ON CONFLICT (id) DO UPDATE SET status = 'active', verification_status = 'verified';
    END IF;
END $$;

COMMIT;

-- VERIFICATION
SELECT 
    p.email, 
    ur.role, 
    p.status, 
    p.verification_status 
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.email IN ('admin@pravokha.com', 'seller01@pravokha.com');
