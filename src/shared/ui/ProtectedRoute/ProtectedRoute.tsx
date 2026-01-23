import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/core/context/AuthContext";
import styles from "./ProtectedRoute.module.css";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: ("ADMIN" | "DEALER" | "USER" | "MODERATOR" | "admin" | "seller" | "user")[];
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

    const effectiveRole = (role || "USER").toUpperCase();
    const uppercaseAllowedRoles = allowedRoles.map(r => {
        if (r === "admin") return "ADMIN";
        if (r === "seller") return "DEALER";
        if (r === "user") return "USER";
        return r.toUpperCase();
    });

    const isMerchantRoute = (uppercaseAllowedRoles.includes("DEALER") || allowedRoles.includes("seller")) && location.pathname.startsWith("/seller");
    const hasAccess = (!allowedRoles || uppercaseAllowedRoles.includes(effectiveRole)) && !(isMerchantRoute && isSuspended);

    if (!hasAccess) {
        return <Navigate to={isSuspended ? "/tickets" : "/"} replace />;
    }

    return <>{children}</>;
}
