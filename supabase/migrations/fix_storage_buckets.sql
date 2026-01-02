-- ================================================================================================
-- 🔧 CRITICAL FIX: STORAGE BUCKETS FOR PRODUCTS & COMBO OFFERS
-- ================================================================================================
-- Migration: Add missing storage buckets and policies
-- Date: 2026-01-01
-- Purpose: Fix "Bucket not found" error for product/combo offer image uploads

BEGIN;

-- ================================================================================================
-- STEP 1: CREATE STORAGE BUCKETS
-- ================================================================================================

-- 1.1 Products Bucket (for product images, combo offer images, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true, -- Public bucket so images are accessible
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 1.2 Profiles Bucket (user avatars, seller logos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  2097152, -- 2MB limit for avatars
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ================================================================================================
-- STEP 2: STORAGE POLICIES - PRODUCTS BUCKET
-- ================================================================================================

-- 2.1 Public Read Access (anyone can view product images)
DROP POLICY IF EXISTS "Public Read Products" ON storage.objects;
CREATE POLICY "Public Read Products"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- 2.2 Authenticated Upload (any authenticated user can upload)
DROP POLICY IF EXISTS "Authenticated Upload Products" ON storage.objects;
CREATE POLICY "Authenticated Upload Products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- 2.3 Admin Full Access (admins can upload, update, delete)
DROP POLICY IF EXISTS "Admin Manage Products Storage" ON storage.objects;
CREATE POLICY "Admin Manage Products Storage"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'products' 
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'products' 
  AND public.is_admin(auth.uid())
);

-- 2.4 Seller Upload to Own Folder
DROP POLICY IF EXISTS "Sellers Upload Products" ON storage.objects;
CREATE POLICY "Sellers Upload Products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2.5 Seller Update/Delete Own Files
DROP POLICY IF EXISTS "Sellers Manage Own Products" ON storage.objects;
CREATE POLICY "Sellers Manage Own Products"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Sellers Delete Own Products" ON storage.objects;
CREATE POLICY "Sellers Delete Own Products"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ================================================================================================
-- STEP 3: STORAGE POLICIES - PROFILES BUCKET
-- ================================================================================================

-- 3.1 Public Read Access
DROP POLICY IF EXISTS "Public Read Profiles" ON storage.objects;
CREATE POLICY "Public Read Profiles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- 3.2 Authenticated Upload
DROP POLICY IF EXISTS "Authenticated Upload Profiles" ON storage.objects;
CREATE POLICY "Authenticated Upload Profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- 3.3 Admin Full Access
DROP POLICY IF EXISTS "Admin Manage Profiles Storage" ON storage.objects;
CREATE POLICY "Admin Manage Profiles Storage"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'profiles' 
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'profiles' 
  AND public.is_admin(auth.uid())
);

-- 3.4 Users Manage Own Profile Images
DROP POLICY IF EXISTS "Users Manage Own Profile Images" ON storage.objects;
CREATE POLICY "Users Manage Own Profile Images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;

-- ================================================================================================
-- VERIFICATION
-- ================================================================================================
SELECT 
  '✅ STORAGE BUCKETS VERIFIED' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE id IN ('products', 'profiles')) as buckets_created,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') as policies_created;

-- Show bucket details
SELECT 
  id as bucket_name,
  public,
  file_size_limit / 1024 / 1024 as max_mb,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('products', 'profiles')
ORDER BY id;
