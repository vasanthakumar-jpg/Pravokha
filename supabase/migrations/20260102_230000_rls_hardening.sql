-- ================================================================================================
-- 🛡️ ENTERPRISE RLS HARDENING (FINAL POLISH)
-- ================================================================================================

BEGIN;

-- 1. Standardize user_roles Constraint
-- First, ensure the 'role' column is TEXT to avoid conflicts with old Enums (like app_role)
DO $$ 
BEGIN 
    -- If the column is an enum, convert it to text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'role' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE public.user_roles ALTER COLUMN role TYPE TEXT;
    END IF;
END $$;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('admin', 'seller', 'support', 'manager', 'user', 'buyer'));

-- 2. Lockdown Profiles Status Management
-- We need to ensure users can edit their profile but NOT their status/verification_status.
-- Supabase doesn't support column-level RLS directly, so we use a trigger-based guard.

CREATE OR REPLACE FUNCTION public.guard_profile_governance()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if someone other than an admin is trying to change sensitive columns
    IF NOT public.is_admin() THEN
        IF (NEW.status != OLD.status) OR (NEW.verification_status != OLD.verification_status) THEN
            -- Revert sensitive columns to old values for non-admins
            NEW.status := OLD.status;
            NEW.verification_status := OLD.verification_status;
            
            -- Optional: Log the attempt
            INSERT INTO public.audit_logs (actor_id, target_id, target_type, action_type, description, severity)
            VALUES (auth.uid(), NEW.id::text, 'user', 'governance_violation', 'Attempted unauthorized status/verification change', 'warning');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_profile_governance ON public.profiles;
CREATE TRIGGER trg_guard_profile_governance
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_profile_governance();

-- 3. Harden user_roles RLS
-- Only admins can Create/Update/Delete roles. Users can only READ their own roles.
DROP POLICY IF EXISTS "Admins Manage All Roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users Read Own Roles" ON public.user_roles;

CREATE POLICY "Admins Manage All Roles" 
ON public.user_roles FOR ALL 
USING (public.is_admin());

CREATE POLICY "Users Read Own Roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Standardize Audit Log RLS
-- Users can only see audit logs pertaining to themselves (if any), Admins see all.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users View Own Audit Logs" ON public.audit_logs;
CREATE POLICY "Users View Own Audit Logs" 
ON public.audit_logs FOR SELECT 
USING (auth.uid()::text = target_id OR auth.uid() = actor_id);

DROP POLICY IF EXISTS "Admins View All Audit Logs" ON public.audit_logs;
CREATE POLICY "Admins View All Audit Logs" 
ON public.audit_logs FOR SELECT 
USING (public.is_admin());

COMMIT;

-- VERIFICATION
SELECT 
    '🛡️ RLS HARDENING COMPLETE' as status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('user_roles', 'profiles', 'audit_logs')) as policy_count;
