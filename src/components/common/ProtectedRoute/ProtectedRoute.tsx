import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./ProtectedRoute.module.css";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: ("admin" | "seller" | "user" | "moderator")[];
    redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = "/auth" }: ProtectedRouteProps) {
    const { user, role, loading, isSuspended } = useAuth();
    const location = useLocation();
    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
    }

    const effectiveRole = role || "user";
    const isMerchantRoute = allowedRoles.includes("seller") && location.pathname.startsWith("/seller");
    const hasAccess = (!allowedRoles || allowedRoles.includes(effectiveRole)) && !(isMerchantRoute && isSuspended);

    if (!hasAccess) {
        return <Navigate to={isSuspended ? "/tickets" : "/"} replace />;
    }

    return <>{children}</>;
}
