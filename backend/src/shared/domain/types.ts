/**
 * Shared Domain Entities
 * 
 * This file contains business-critical types and enums that are shared 
 * across multiple feature modules.
 */

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    SELLER = 'SELLER',
    CUSTOMER = 'CUSTOMER'
}

export interface IUserDomain {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}
