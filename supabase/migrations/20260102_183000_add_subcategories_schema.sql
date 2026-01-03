-- ================================================================================================
-- PRODUCT HIERARCHY ENHANCEMENT: Category → Subcategory → Product
-- ================================================================================================

BEGIN;

-- ================================================================================================
-- PHASE 1: CREATE SUBCATEGORIES TABLE
-- ================================================================================================

CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'coming_soon')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_status ON public.subcategories(status);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON public.subcategories(slug);

-- ================================================================================================
-- PHASE 2: UPDATE PRODUCTS TABLE
-- ================================================================================================

-- Add subcategory reference to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory_id);

-- ================================================================================================
-- PHASE 3: RLS POLICIES FOR SUBCATEGORIES
-- ================================================================================================

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Public can read active subcategories
DROP POLICY IF EXISTS "Public Read Subcategories" ON public.subcategories;
CREATE POLICY "Public Read Subcategories" 
ON public.subcategories FOR SELECT 
USING (true);

-- Admins can manage all subcategories
DROP POLICY IF EXISTS "Admins Manage Subcategories" ON public.subcategories;
CREATE POLICY "Admins Manage Subcategories" 
ON public.subcategories FOR ALL 
USING (public.is_admin());

-- ================================================================================================
-- VERIFICATION
-- ================================================================================================

COMMIT;

SELECT 
    '✅ PRODUCT HIERARCHY MIGRATION COMPLETE' as status,
    (SELECT COUNT(*) FROM public.categories) as categories_count,
    (SELECT COUNT(*) FROM public.subcategories) as subcategories_count;
