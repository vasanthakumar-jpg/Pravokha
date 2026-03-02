import { marketplaceEmitter, MARKETPLACE_EVENTS, OrderStatusChangedEvent } from '../util/events';
import { prisma } from '../../infra/database/client';
import { ShippingService } from '../../feat/order/shipping.service';
import { OrderStatus } from '@prisma/client';

export const registerMarketplaceListeners = () => {
    console.log('[MarketplaceListeners] Initializing listeners...');

    // 1. Handle Order Status Changes
    marketplaceEmitter.on(MARKETPLACE_EVENTS.ORDER_STATUS_CHANGED, async (event: OrderStatusChangedEvent) => {
        const { orderId, newStatus } = event;

        try {
            // A. Post-Shipped: Auto-assign AWB if missing
            if (newStatus === OrderStatus.SHIPPED) {
                await ShippingService.autoAssignAwb(orderId);
            }

            // B. Out for Delivery: Generate OTP
            if (newStatus === OrderStatus.OUT_FOR_DELIVERY) {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiry = new Date();
                expiry.setHours(expiry.getHours() + 24); // 24 hour expiry

                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        deliveryOtp: otp,
                        otpExpiresAt: expiry
                    }
                });

                console.log(`[MarketplaceListeners] Generated delivery OTP for order ${orderId}: ${otp}`);
                // In real world, send SMS/Email here
            }

            // C. Delivered: Perform final financial settlement (simulation)
            if (newStatus === OrderStatus.DELIVERED) {
                // We could trigger payout eligibility logic here
                console.log(`[MarketplaceListeners] Order ${orderId} delivered. Settlement cycle initiated.`);
            }

        } catch (error) {
            console.error(`[MarketplaceListeners] Error handling status change for order ${orderId}:`, error);
        }
    });

    // 2. Handle Admin Actions for Audit Logs
    marketplaceEmitter.on(MARKETPLACE_EVENTS.ADMIN_ACTION_PERFORMED, async (data: any) => {
        try {
            await prisma.auditLog.create({
                data: {
                    performedBy: data.adminId,
                    performerRole: data.role,
                    action: data.action,
                    entity: data.entity,
                    entityId: data.entityId,
                    changes: JSON.stringify(data.changes),
                    reason: data.reason,
                    ipAddress: data.ip
                }
            });
            console.log(`[MarketplaceListeners] Logged admin action: ${data.action} on ${data.entity}`);
        } catch (error) {
            console.error('[MarketplaceListeners] Failed to log admin action:', error);
        }
    });
};
