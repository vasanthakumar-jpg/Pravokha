/**
 * Role Utilities - Safe Role Normalization & Comparison
 * 
 * Provides backward-compatible utilities for role-based access control
 * that handle case-insensitive comparisons and null safety.
 * 
 * WHY THIS EXISTS:
 * - Frontend might send roles in mixed case ("admin" vs "ADMIN")
 * - Database stores uppercase enum values
 * - Need consistent comparison across entire application
 */

import { Role } from '@prisma/client';

/**
 * Safely normalize role to uppercase enum value
 * 
 * @param role - Role string from user input, token, or database
 * @returns Normalized Role enum or null if invalid
 * 
 * @example
 * normalizeRole("super_admin") // Role.SUPER_ADMIN
 * normalizeRole("CUSTOMER")    // Role.CUSTOMER
 * normalizeRole(null)          // null
 * normalizeRole("invalid")     // null (with warning)
 */
export function normalizeRole(role: string | Role | null | undefined): Role | null {
    if (!role) return null;
    
    const roleUpper = typeof role === 'string' ? role.toUpperCase() : role;
    
    // Validate against Prisma-generated Role enum
    if (Object.values(Role).includes(roleUpper as Role)) {
        return roleUpper as Role;
    }
    
    // Log invalid roles for debugging (possible attack or data corruption)
    console.warn(`[RoleUtils] Invalid role detected: "${role}" - normalized to null. Valid roles:`, Object.values(Role));
    return null;
}

/**
 * Safe role comparison - case-insensitive
 * 
 * @param userRole - User's role (from JWT, database, etc.)
 * @param targetRole - Role to check against
 * @returns true if roles match
 * 
 * @example
 * isRole("super_admin", Role.SUPER_ADMIN) // true
 * isRole("ADMIN", Role.ADMIN)             // true
 * isRole("admin", Role.SUPER_ADMIN)       // false
 */
export function isRole(userRole: string | Role | null | undefined, targetRole: Role): boolean {
    const normalized = normalizeRole(userRole);
    return normalized === targetRole;
}

/**
 * Check if user has ANY of the specified roles
 * 
 * @param userRole - User's role
 * @param allowedRoles - Array of acceptable roles
 * @returns true if user has at least one of the allowed roles
 * 
 * @example
 * hasAnyRole("ADMIN", [Role.SUPER_ADMIN, Role.ADMIN]) // true
 * hasAnyRole("SELLER", [Role.SUPER_ADMIN, Role.ADMIN]) // false
 */
export function hasAnyRole(userRole: string | Role | null | undefined, allowedRoles: Role[]): boolean {
    const normalized = normalizeRole(userRole);
    return normalized !== null && allowedRoles.includes(normalized);
}

/**
 * Check if user is a platform administrator (SUPER_ADMIN or ADMIN)
 * 
 * @param userRole - User's role
 * @returns true if user is SUPER_ADMIN or ADMIN
 * 
 * @example
 * isAdmin("SUPER_ADMIN") // true
 * isAdmin("ADMIN")       // true
 * isAdmin("seller")      // false
 */
export function isAdmin(userRole: string | Role | null | undefined): boolean {
    return hasAnyRole(userRole, [Role.SUPER_ADMIN, Role.ADMIN]);
}

/**
 * Check if user is SUPER_ADMIN (platform owner)
 * 
 * @param userRole - User's role
 * @returns true if user is SUPER_ADMIN
 * 
 * @example
 * isSuperAdmin("SUPER_ADMIN") // true
 * isSuperAdmin("admin")       // false
 */
export function isSuperAdmin(userRole: string | Role | null | undefined): boolean {
    return isRole(userRole, Role.SUPER_ADMIN);
}

/**
 * Check if user is a marketplace seller/vendor
 * 
 * @param userRole - User's role
 * @returns true if user is SELLER
 */
export function isSeller(userRole: string | Role | null | undefined): boolean {
    return isRole(userRole, Role.SELLER);
}

/**
 * Check if user is a customer (buyer)
 * 
 * @param userRole - User's role
 * @returns true if user is CUSTOMER
 */
export function isCustomer(userRole: string | Role | null | undefined): boolean {
    return isRole(userRole, Role.CUSTOMER);
}

/**
 * Get human-readable role display name
 * 
 * @param role - Role enum value
 * @returns Formatted role name for UI display
 * 
 * @example
 * getRoleDisplayName(Role.SUPER_ADMIN) // "Super Admin"
 * getRoleDisplayName(Role.SELLER)      // "Seller"
 */
export function getRoleDisplayName(role: Role | null): string {
    if (!role) return 'Unknown';
    
    const displayNames: Record<Role, string> = {
        [Role.SUPER_ADMIN]: 'Super Admin',
        [Role.ADMIN]: 'Admin',
        [Role.SELLER]: 'Seller',
        [Role.CUSTOMER]: 'Customer'
    };
    
    return displayNames[role] || role.toString();
}
