-- ================================================================================================
-- 🔧 CRITICAL FIX: USER ROLE AUTO-ASSIGNMENT + ADMIN ROLE
-- ================================================================================================
-- Migration: Fix missing user roles and add auto-assignment trigger
-- Date: 2025-12-29
-- Purpose: Ensures all users have roles and prevents the auth blank screen issue

BEGIN;

-- STEP 1: Create admin role for current logged-in user
-- This will automatically get YOUR user ID when you run it while logged in
INSERT INTO user_roles (user_id, role)
SELECT auth.uid(), 'admin'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- STEP 2: Create default 'user' role for all existing users WITHOUT roles
-- This fixes any other users who might be missing roles
INSERT INTO user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.users.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- STEP 3: Create auto-role trigger for NEW users (prevents this issue forever)
-- Every new signup will automatically get 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign 'user' role to every new signup
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_role();

COMMIT;

-- ================================================================================================
-- VERIFICATION
-- ================================================================================================
-- Verify the fix worked
SELECT 
  ur.user_id, 
  ur.role, 
  u.email,
  '✅ SUCCESS: Role assigned!' as status
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.user_id = auth.uid();

-- Should show: { user_id: "...", role: "admin", email: "your@email.com", status: "✅ SUCCESS..." }
