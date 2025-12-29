-- ================================================================================================
-- 🚨 ADMIN GOVERNANCE PATCH: SUSPENDED SELLER TICKET TRACKING
-- ================================================================================================
-- This patch hardens the support ticket system to track and prioritize high-risk submissions.

BEGIN;

-- 1. Extend support_tickets with governance indicators
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS suspended_seller BOOLEAN DEFAULT false;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS is_high_priority BOOLEAN DEFAULT false;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- 2. Fix the check constraint for ticket types
-- First drop existing if it exists (searching generic names usually found in Supabase/PostgREST)
DO $$
BEGIN
    ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_type_check;
END $$;

ALTER TABLE public.support_tickets 
ADD CONSTRAINT support_tickets_type_check 
CHECK (type IN (
    'billing', 'technical_issue', 'general_support', -- standard
    'listing_issue', -- seller specific
    'suspension_appeal', 'account_verification', 'compliance_review', 'payout_issue' -- governance
));

-- 3. Update the enforcement trigger to automatically tag high-risk tickets
CREATE OR REPLACE FUNCTION public.enforce_support_governance() RETURNS TRIGGER AS $$
DECLARE
    v_user_status TEXT;
BEGIN
    SELECT status INTO v_user_status FROM public.profiles WHERE id = NEW.user_id;
    
    -- Real-world Governance: If user is suspended, tag the ticket and enforce category
    IF v_user_status = 'suspended' THEN
        -- Auto-flag for Admin visibility
        NEW.suspended_seller := true;
        NEW.is_high_priority := true;
        NEW.priority := 'urgent';
        
        -- Enforce restricted categories
        IF NEW.type NOT IN ('suspension_appeal', 'account_verification', 'compliance_review', 'payout_issue') THEN
            RAISE EXCEPTION 'GOVERNANCE_LOCK: Suspended accounts are restricted to Appeal, Verification, Compliance, and Payout support only.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Verification
SELECT 
    column_name, 
    data_type, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
AND column_name IN ('suspended_seller', 'is_high_priority', 'priority');
