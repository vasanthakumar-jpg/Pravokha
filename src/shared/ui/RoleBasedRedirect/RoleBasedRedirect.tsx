import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/context/AuthContext';
import { toast } from '@/shared/hook/use-toast';

export function RoleBasedRedirect() {
    const { user, role, loading, isSuspended } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const hasNotifiedSuspension = useRef(false);

    useEffect(() => {
        if (loading || !user) {
            hasNotifiedSuspension.current = false;
            return;
        }

        const currentPath = location.pathname;

        if (isSuspended) {
            if (!hasNotifiedSuspension.current && (currentPath === '/' || currentPath.startsWith('/auth'))) {
                toast({
                    title: "Regulatory Notice: Account Restricted",
                    description: `The account associated with ${user.email} is currently under suspension. Direct marketplace access has been restricted. Please proceed to the Support Portal for identity verification or to file an appeal.`,
                    variant: "destructive",
                });
                hasNotifiedSuspension.current = true;
                navigate('/tickets', { replace: true });
                return;
            }

            if (currentPath.startsWith('/seller')) {
                navigate('/tickets', { replace: true });
            }
            return;
        }

        if (!role) {
            return;
        }

        const roleUpper = role.toUpperCase();

        if (currentPath.startsWith('/admin') && (roleUpper === 'SUPER_ADMIN')) {
            return;
        }

        if (currentPath.startsWith('/seller') && (roleUpper === 'ADMIN')) {
            return;
        }

        // Logic for redirection from Auth/Home pages based on Role
        if (currentPath.startsWith('/auth') || (currentPath === '/' && roleUpper !== 'CUSTOMER')) {
            if (roleUpper === 'SUPER_ADMIN') {
                navigate('/admin/super-dashboard', { replace: true });
            } else if (roleUpper === 'ADMIN') {
                navigate('/admin/staff-dashboard', { replace: true }); // Staff Admin goes to Staff Panel
            } else if (roleUpper === 'SELLER') {
                navigate('/seller', { replace: true });
            } else if (roleUpper === 'CUSTOMER' && currentPath.startsWith('/auth')) {
                navigate('/', { replace: true });
            }
            return;
        }

        // Prevent cross-role access (Basic Guard in Redirector)
        // Note: ProtectedRoute handles the hard blocks, but this helps redirect early
        if (currentPath.startsWith('/admin') && roleUpper !== 'SUPER_ADMIN' && roleUpper !== 'ADMIN') {
            navigate('/unauthorized', { replace: true });
        }
        if (currentPath.startsWith('/seller') && roleUpper !== 'SELLER') {
            navigate('/unauthorized', { replace: true });
        }
    }, [user, role, loading, isSuspended, navigate, location.pathname]);

    return null;
}
