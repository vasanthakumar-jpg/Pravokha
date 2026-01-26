import { OrderStatus, Role } from '@prisma/client';

export interface StateTransition {
    from: OrderStatus;
    to: OrderStatus;
    allowedRoles: Role[];
    requiredFields?: string[];
}

export const ORDER_TRANSITIONS: StateTransition[] = [
    // From PENDING
    { from: OrderStatus.PENDING, to: OrderStatus.PROCESSING, allowedRoles: [Role.ADMIN, Role.DEALER] },
    { from: OrderStatus.PENDING, to: OrderStatus.CANCELLED, allowedRoles: [Role.ADMIN, Role.USER] },

    // From PROCESSING (Confirmed/Packed in UI)
    { from: OrderStatus.PROCESSING, to: OrderStatus.SHIPPED, allowedRoles: [Role.ADMIN, Role.DEALER], requiredFields: ['trackingNumber'] },
    { from: OrderStatus.PROCESSING, to: OrderStatus.CANCELLED, allowedRoles: [Role.ADMIN] },
    { from: OrderStatus.PROCESSING, to: OrderStatus.PENDING, allowedRoles: [Role.ADMIN, Role.DEALER] }, // Unpacking/Mistake

    // From SHIPPED
    { from: OrderStatus.SHIPPED, to: OrderStatus.DELIVERED, allowedRoles: [Role.ADMIN] },

    // Terminal states: DELIVERED, CANCELLED
];

/**
 * Validates if an order can transition from one state to another based on role.
 */
export const isValidTransition = (currentStatus: OrderStatus, newStatus: OrderStatus, role: Role): boolean => {
    // Admin can perform any transition theoretically, but we still apply rules for consistency
    // unless it's a manual override.

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
