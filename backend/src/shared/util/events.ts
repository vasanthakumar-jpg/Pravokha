import { EventEmitter } from 'events';

export const marketplaceEmitter = new EventEmitter();

export const MARKETPLACE_EVENTS = {
    ORDER_STATUS_CHANGED: 'order.status_changed',
    ORDER_CREATED: 'order.created',
    DELIVERY_OTP_VERIFIED: 'delivery.otp_verified',
    ADMIN_ACTION_PERFORMED: 'admin.action_performed'
};

// Define event payload types
export interface OrderStatusChangedEvent {
    orderId: string;
    oldStatus: string;
    newStatus: string;
    userId: string;
    role: string;
    metadata?: any;
}

export interface OrderCreatedEvent {
    orderId: string;
    customerId: string;
    vendorId: string;
    amount: number;
}
