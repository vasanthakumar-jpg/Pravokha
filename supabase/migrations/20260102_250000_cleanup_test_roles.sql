    -- ================================================================================================
    -- 🧹 TEST ACCOUNT CLEANUP (ENSURING CORRECT ROLES)
    -- ================================================================================================
    -- Purpose:
    -- 1. Remove redundant 'user' roles from test accounts to avoid any confusion.
    -- 2. Ensure admin and seller accounts have EXACTLY the right permissions.
    -- ================================================================================================

    BEGIN;

    DO $$
    DECLARE
        v_admin_id UUID;
        v_seller_id UUID;
    BEGIN
        -- STEP A: Clean Admin Account (admin@pravokha.com)
        SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@pravokha.com';
        IF v_admin_id IS NOT NULL THEN
            -- Delete all roles first to start clean
            DELETE FROM public.user_roles WHERE user_id = v_admin_id;
            
            -- Insert ONLY the admin role
            INSERT INTO public.user_roles (user_id, role) VALUES (v_admin_id, 'admin');
            
            -- Ensure profile is active
            UPDATE public.profiles SET status = 'active' WHERE id = v_admin_id;
        END IF;

        -- STEP B: Clean Seller Account (seller01@pravokha.com)
        SELECT id INTO v_seller_id FROM auth.users WHERE email = 'seller01@pravokha.com';
        IF v_seller_id IS NOT NULL THEN
            -- Delete all roles first
            DELETE FROM public.user_roles WHERE user_id = v_seller_id;
            
            -- Insert ONLY the seller role
            INSERT INTO public.user_roles (user_id, role) VALUES (v_seller_id, 'seller');
            
            -- Ensure profile is active and verified
            UPDATE public.profiles SET status = 'active', verification_status = 'verified' WHERE id = v_seller_id;
        END IF;
    END $$;

    COMMIT;

    -- VERIFICATION: Check the current roles
    SELECT 
        p.email, 
        ur.role as assigned_role, 
        p.status, 
        p.verification_status 
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.email IN ('admin@pravokha.com', 'seller01@pravokha.com');
