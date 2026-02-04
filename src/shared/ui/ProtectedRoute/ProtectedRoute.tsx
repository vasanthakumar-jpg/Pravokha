import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/core/context/AuthContext";
import styles from "./ProtectedRoute.module.css";

import { usePermission, PermissionAction } from "@/core/hooks/usePermission";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: ("SUPER_ADMIN" | "ADMIN" | "SELLER" | "CUSTOMER" | "MODERATOR" | "admin" | "seller" | "customer")[];
    requiredPermission?: PermissionAction;
    redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, requiredPermission, redirectTo = "/auth" }: ProtectedRouteProps) {
    const { user, role, loading, isSuspended } = useAuth();
    const location = useLocation();
    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
    }

    const effectiveRole = String(role).toUpperCase(); // Ensure string comparison

    // Normalize allowed roles to uppercase for comparison
    // DIRECT MAPPING: Now that we have SELLER role, we don't need to map "seller" to "ADMIN"
    const uppercaseAllowedRoles = allowedRoles.map(r => r.toUpperCase());

    const isMerchantRoute = location.pathname.startsWith("/seller");

    // Permission Check
    const { can } = usePermission();
    // Super Admin bypasses all checks
    const isSuperAdmin = effectiveRole === 'SUPER_ADMIN';
    const hasPermission = isSuperAdmin || (!requiredPermission || (requiredPermission && can(requiredPermission)));

    // Role Check
    const hasRoleAccess = uppercaseAllowedRoles.includes(effectiveRole);

    const hasAccess = (hasRoleAccess && !(isMerchantRoute && isSuspended)) && hasPermission;

    if (!hasAccess) {
        // Prevent infinite loop if redirected to home but home denies access
        // If Super Admin accesses /, they should see it.
        // If they access /admin but allowedRoles doesn't include SUPER_ADMIN (unlikely), they get redirected.

        // Debug
        console.log(`[ProtectedRoute] Access Denied. UserRole: ${effectiveRole}, Allowed: ${uppercaseAllowedRoles}, Path: ${location.pathname}`);
        return <Navigate to={user ? "/unauthorized" : "/auth"} replace />;
    }

    return <>{children}</>;
}
