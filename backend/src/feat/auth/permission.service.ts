import { AuditService } from '../../shared/service/audit.service';
import { Role, PrismaClient } from '@prisma/client';
import { isRole, isSuperAdmin, isAdmin, normalizeRole } from '../../shared/utils/role.utils';

const prisma = new PrismaClient();

export class PermissionService {
    /**
     * Main permission checking function
     */
    static async canPerform(
        userId: string,
        userRole: Role,
        action: string, // e.g., 'EDIT_PRODUCT', 'VIEW_ORDERS'
        resource: string, // e.g., 'PRODUCT', 'ORDER'
        resourceOwnerId?: string
    ): Promise<boolean> {
        // 1. SUPER_ADMIN has unrestricted access
        // SECURITY FIX: Use case-insensitive comparison
        if (isSuperAdmin(userRole)) {
            return true;
        }

        // 2. ADMIN (Platform Staff/Support) relies on specific permissions
        // SECURITY FIX: Use case-insensitive comparison
        if (isRole(userRole, Role.ADMIN)) {
            // Check if they are checking for platform-level admin permissions
            const isPlatformAction = [
                'MANAGE_USER', 'VIEW_USERS', 'VERIFY_VENDOR', 'CHANGE_ROLE',
                'MANAGE_CATEGORY', 'VIEW_ANALYTICS', 'MANAGE_SETTINGS',
                'VIEW_AUDIT_LOGS', 'MANAGE_PRODUCTS', 'APPROVE_PRODUCT',
                'MANAGE_SETTINGS_SYSTEM', 'MANAGE_PRODUCTS_MARKETPLACE',
                'APPROVE_PRODUCT_MARKETPLACE', 'VIEW_AUDIT_LOGS_SYSTEM',
                'MANAGE_ADMINS_SYSTEM'
            ].includes(action);

            if (isPlatformAction) {
                return this.checkAdminPermission(userId, action, resource);
            }

            // Staff admins might also need to view products/orders globally
            return this.checkAdminPermission(userId, action, resource);
        }

        // 3. SELLER (Marketplace Vendor) relies on shop ownership
        // SECURITY FIX: Use case-insensitive comparison
        if (isRole(userRole, Role.SELLER)) {
            return this.checkVendorPermission(action, resource, userId, resourceOwnerId);
        }

        // 4. CUSTOMER has limited access
        // SECURITY FIX: Use case-insensitive comparison
        if (isRole(userRole, Role.CUSTOMER)) {
            return this.checkCustomerPermission(action, resource, userId, resourceOwnerId);
        }

        return false;
    }

    /**
     * Check specific platform management permissions (for sub-admins if any)
     */
    private static async checkAdminPermission(
        adminId: string,
        action: string,
        resource: string
    ): Promise<boolean> {
        const permissions = await prisma.adminPermission.findUnique({
            where: { adminId: adminId }, // Mapping to schema: adminPermission uses adminId
        });

        if (!permissions) return false;

        // Map action+resource to DB fields
        switch (action) {
            case 'APPROVE_PRODUCT':
            case 'APPROVE_PRODUCT_MARKETPLACE':
                return permissions.canApproveProducts;
            case 'EDIT_PRODUCT':
            case 'UPDATE_PRODUCT':
            case 'MANAGE_PRODUCTS':
            case 'MANAGE_PRODUCTS_MARKETPLACE':
                return permissions.canEditAnyProduct;
            case 'DELETE_PRODUCT':
                return permissions.canDeleteAnyProduct;
            case 'MANAGE_CATEGORY':
            case 'MANAGE_CATEGORY_SYSTEM':
                return permissions.canManageCategories;
            case 'MANAGE_USER':
            case 'VIEW_USERS':
            case 'MANAGE_USER_USER':
            case 'VIEW_USERS_USER':
                return permissions.canManageUsers;
            case 'SUSPEND_USER':
            case 'SUSPEND_USER_USER':
                return permissions.canSuspendUsers;
            case 'ACTIVATE_USER_USER':
                return permissions.canSuspendUsers; // Using same flag for activation
            case 'VERIFY_VENDOR':
                return permissions.canVerifyVendors;
            case 'CHANGE_ROLE':
                return permissions.canChangeUserRoles;
            case 'VIEW_ALL_ORDERS':
                return permissions.canViewAllOrders;
            case 'CANCEL_ORDER':
                return permissions.canCancelAnyOrder;
            case 'UPDATE_STATUS': // For Order status updates
                return permissions.canViewAllOrders; // Admins who can view orders can update them
            case 'DELETE_ORDER':
                return false; // Reserved for SUPER_ADMIN only (handled in canPerform)
            case 'ISSUE_REFUND':
                return permissions.canIssueRefunds;
            case 'APPROVE_PAYOUT':
                return permissions.canApprovePayouts;
            case 'VIEW_FINANCIALS':
                return permissions.canViewFinancials;
            case 'MODIFY_COMMISSION':
                return permissions.canModifyCommission;
            case 'VIEW_AUDIT_LOGS':
            case 'VIEW_AUDIT_LOGS_SYSTEM':
                return permissions.canAccessAuditLogs;
            case 'MANAGE_ADMINS':
            case 'MANAGE_ADMINS_SYSTEM':
                return permissions.canManageAdmins;
            case 'CHANGE_SETTINGS':
            case 'MANAGE_SETTINGS':
            case 'MANAGE_SETTINGS_SYSTEM':
                return permissions.canChangeSettings;
            case 'VIEW_ANALYTICS':
            case 'VIEW_ANALYTICS_SYSTEM':
                return permissions.canViewFinancials; // Mapping analytics to financials permission
            default:
                return false;
        }
    }

    /**
     * Check vendor permissions (ownership based)
     */
    private static async checkVendorPermission(
        action: string,
        resource: string,
        userId: string,
        resourceOwnerId?: string
    ): Promise<boolean> {
        // Find vendor associated with this user
        const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
        if (!vendor) return false;

        switch (resource) {
            case 'PRODUCT':
                if (action === 'CREATE') return true;
                if (['EDIT', 'UPDATE', 'DELETE', 'VIEW'].includes(action)) {
                    // resourceOwnerId should be the vendorId here
                    return vendor.id === resourceOwnerId;
                }
                return false;

            case 'ORDER':
                // Vendors can manage orders split specifically for them
                if (['VIEW', 'UPDATE_STATUS'].includes(action)) {
                    return vendor.id === resourceOwnerId;
                }
                return false;

            case 'PAYOUT':
                if (action === 'REQUEST' || action === 'VIEW') return vendor.id === resourceOwnerId;
                return false;

            default:
                return false;
        }
    }

    /**
     * Check customer permissions (ownership based)
     */
    private static checkCustomerPermission(
        action: string,
        resource: string,
        userId: string,
        resourceOwnerId?: string
    ): boolean {
        switch (resource) {
            case 'ORDER':
                if (action === 'CREATE') return true;
                if (action === 'VIEW' || action === 'CANCEL') return userId === resourceOwnerId;
                return false;

            case 'PROFILE':
            case 'ADDRESS':
                return userId === resourceOwnerId;

            case 'REVIEW':
                if (action === 'CREATE' || action === 'UPDATE' || action === 'DELETE') return true;
                return false;

            case 'PRODUCT':
                if (action === 'VIEW') return true;
                return false;

            default:
                return false;
        }
    }
}
