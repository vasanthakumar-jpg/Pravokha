/**
 * Shared Domain Entities
 * 
 * This file contains business-critical types and enums that are shared 
 * across multiple feature modules.
 */

export enum UserRole {
    ADMIN = 'ADMIN',
    DEALER = 'DEALER',
    USER = 'USER'
}

export interface IUserDomain {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}
