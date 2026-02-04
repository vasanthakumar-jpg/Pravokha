import { useAuth, UserRole } from "@/core/context/AuthContext";

export type PermissionAction =
    | 'APPROVE_PRODUCT'
    | 'CREATE_PRODUCT'
    | 'EDIT_ANY_PRODUCT'
    | 'DELETE_ANY_PRODUCT'
    | 'MANAGE_CATEGORIES'
    | 'MANAGE_USERS'
    | 'SUSPEND_USERS'
    | 'VERIFY_VENDOR'
    | 'CHANGE_USER_ROLES'
    | 'VIEW_ALL_ORDERS'
    | 'CANCEL_ANY_ORDER'
    | 'ISSUE_REFUNDS'
    | 'APPROVE_PAYOUTS'
    | 'VIEW_FINANCIALS'
    | 'MODIFY_COMMISSION'
    | 'ACCESS_AUDIT_LOGS'
    | 'MANAGE_ADMINS'
    | 'CHANGE_SETTINGS';

export const usePermission = () => {
    const { user, role } = useAuth();

    const can = (action: PermissionAction): boolean => {
        if (!user || !role) return false;

        // 1. SUPER_ADMIN has all permissions
        const normalizedRole = role.toUpperCase();
        if (normalizedRole === 'SUPER_ADMIN') return true;

        // 2. ADMIN (Staff) or SUPER_ADMIN - already handled SUPER_ADMIN above
        // If the user has explicitly assigned permissions, check them
        if (user.admin_permissions) {
            const perms = user.admin_permissions;
            switch (action) {
                case 'APPROVE_PRODUCT': return !!perms.canApproveProducts;
                case 'CREATE_PRODUCT': return !!perms.canAddProducts || normalizedRole === 'SUPER_ADMIN';
                case 'EDIT_ANY_PRODUCT': return !!perms.canEditAnyProduct;
                case 'DELETE_ANY_PRODUCT': return !!perms.canDeleteAnyProduct;
                case 'MANAGE_CATEGORIES': return !!perms.canManageCategories;
                case 'MANAGE_USERS': return !!perms.canManageUsers;
                case 'SUSPEND_USERS': return !!perms.canSuspendUsers;
                case 'VERIFY_VENDOR': return !!perms.canVerifyDealers || !!perms.canVerifyVendors;
                case 'CHANGE_USER_ROLES': return !!perms.canChangeUserRoles;
                case 'VIEW_ALL_ORDERS': return !!perms.canViewAllOrders;
                case 'CANCEL_ANY_ORDER': return !!perms.canCancelAnyOrder;
                case 'ISSUE_REFUNDS': return !!perms.canIssueRefunds;
                case 'APPROVE_PAYOUTS': return !!perms.canApprovePayouts;
                case 'VIEW_FINANCIALS': return !!perms.canViewFinancials;
                case 'MODIFY_COMMISSION': return !!perms.canModifyCommission;
                case 'ACCESS_AUDIT_LOGS': return !!perms.canAccessAuditLogs;
                case 'MANAGE_ADMINS': return !!perms.canManageAdmins;
                case 'CHANGE_SETTINGS': return !!perms.canChangeSettings;
                default: return false;
            }
        }

        return false;
    };

    return { can };
};
