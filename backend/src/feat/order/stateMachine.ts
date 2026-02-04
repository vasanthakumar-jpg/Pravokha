import { OrderStatus, Role } from '@prisma/client';

export interface StateTransition {
    from: OrderStatus;
    to: OrderStatus;
    allowedRoles: Role[];
    requiredFields?: string[];
}

export const ORDER_TRANSITIONS: StateTransition[] = [
    // From PENDING
    { from: OrderStatus.PENDING, to: OrderStatus.PROCESSING, allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER] },
    { from: OrderStatus.PENDING, to: OrderStatus.CANCELLED, allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CUSTOMER, Role.SELLER] },

    // From PROCESSING
    { from: OrderStatus.PROCESSING, to: OrderStatus.SHIPPED, allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER], requiredFields: ['trackingNumber'] },
    { from: OrderStatus.PROCESSING, to: OrderStatus.CANCELLED, allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER] },
    { from: OrderStatus.PROCESSING, to: OrderStatus.PENDING, allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER] },

    // From SHIPPED
    { from: OrderStatus.SHIPPED, to: OrderStatus.DELIVERED, allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER] },
    { from: OrderStatus.SHIPPED, to: OrderStatus.CANCELLED, allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER] },

    // Terminal states: DELIVERED, CANCELLED
];

/**
 * Validates if an order can transition from one state to another based on role.
 */
export const isValidTransition = (currentStatus: OrderStatus, newStatus: OrderStatus, role: Role): boolean => {
    // SUPER_ADMIN can perform any transition
    if (role === Role.SUPER_ADMIN) return true;

    const transition = ORDER_TRANSITIONS.find(t =>
        t.from === currentStatus &&
        t.to === newStatus &&
        t.allowedRoles.includes(role)
    );

    return !!transition;
};

/**
 * Returns required fields for a specific transition.
 */
export const getRequiredFieldsForTransition = (from: OrderStatus, to: OrderStatus): string[] => {
    const transition = ORDER_TRANSITIONS.find(t => t.from === from && t.to === to);
    return transition?.requiredFields || [];
};

/**
 * Checks if a status is terminal.
 */
export const isTerminalStatus = (status: OrderStatus): boolean => {
    return status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;
};
