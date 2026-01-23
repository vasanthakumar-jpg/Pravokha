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

        if (currentPath.startsWith('/admin') && (role === 'ADMIN' || role === 'admin')) {
            return;
        }

        if (currentPath.startsWith('/seller') && (role === 'DEALER' || role === 'seller')) {
            return;
        }

        if (currentPath.startsWith('/auth') || currentPath === '/') {
            if (role === 'ADMIN' || role === 'admin') {
                if (currentPath !== '/admin') navigate('/admin', { replace: true });
            } else if (role === 'DEALER' || role === 'seller') {
                if (!currentPath.startsWith('/seller')) navigate('/seller', { replace: true });
            } else if (currentPath.startsWith('/auth') && (role === 'USER' || role === 'user')) {
                navigate('/', { replace: true });
            }
            return;
        }
    }, [user, role, loading, isSuspended, navigate, location.pathname]);

    return null;
}
