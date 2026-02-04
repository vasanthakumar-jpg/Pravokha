import { prisma } from '../../infra/database/client';
import { Role } from '@prisma/client';

export class NotificationService {
    static async createNotification(data: {
        userId: string;
        title: string;
        message: string;
        type: 'order' | 'info' | 'alert' | 'message' | 'order_cancelled';
        link?: string;
        metadata?: any;
    }) {
        // Check User Preferences
        const prefs = await prisma.userPreference.findUnique({
            where: { userId: data.userId }
        });

        if (prefs) {
            if (data.type === 'order' && !prefs.orderUpdates) {
                console.log(`[NotificationService] Skipping notification for user ${data.userId}: orderUpdates disabled`);
                return null;
            }
            if (data.type === 'info' && !prefs.marketingEmails) { // Assuming info/marketing related
                console.log(`[NotificationService] Skipping notification for user ${data.userId}: marketingEmails disabled`);
                return null;
            }
        }

        return await prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                link: data.link,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            }
        });
    }

    // Helper to get role-based message link
    private static getMessageLink(role: Role): string {
        switch (role) {
            case Role.SUPER_ADMIN:
            case Role.ADMIN: return '/admin/messages';
            case Role.SELLER: return '/seller/messages';
            case Role.CUSTOMER: return '/user/messages';
            default: return '/user/messages';
        }
    }

    // Helper to get role-based order link
    private static getOrderLink(role: Role, orderId?: string): string {
        const isPlatformAdmin = role === Role.SUPER_ADMIN || role === Role.ADMIN;
        const base = isPlatformAdmin ? '/admin/orders' : role === Role.SELLER ? '/seller/orders' : '/user/orders';

        if (orderId) {
            if (role === Role.CUSTOMER) return `/user/orders/detail/${orderId}`;
            return `${base}/${orderId}`;
        }
        return base;
    }

    // ORDER PLACED - Notify User
    static async notifyOrderPlaced(userId: string, orderNumber: string, orderId: string, total: number, expectedDelivery: string = '5-7 days') {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        return this.createNotification({
            userId,
            title: 'Order Placed Successfully! 🎉',
            message: `Your order #${orderNumber} has been successfully placed! Total: ₹${total.toLocaleString()}. Expected delivery: ${expectedDelivery}.`,
            type: 'order',
            link: this.getOrderLink(user?.role || Role.CUSTOMER, orderId),
            metadata: { orderId, orderNumber, total }
        });
    }

    // ORDER CANCELLED - Notify User
    static async notifyOrderCancelled(userId: string, orderNumber: string, orderId: string, refundAmount: number) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        return this.createNotification({
            userId,
            title: 'Order Cancelled',
            message: `Order #${orderNumber} has been cancelled successfully. Refund of ₹${refundAmount.toLocaleString()} will be processed within 5-7 business days.`,
            type: 'order_cancelled',
            link: this.getOrderLink(user?.role || Role.CUSTOMER, orderId),
            metadata: { orderId, orderNumber, refundAmount }
        });
    }

    // REFUND PROCESSED - Notify User
    static async notifyRefundProcessed(userId: string, orderNumber: string, orderId: string, refundAmount: number, transactionId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        return this.createNotification({
            userId,
            title: 'Refund Processed ✅',
            message: `Refund of ₹${refundAmount.toLocaleString()} for order #${orderNumber} has been processed to your account. Transaction ID: ${transactionId}.`,
            type: 'order',
            link: this.getOrderLink(user?.role || Role.CUSTOMER, orderId),
            metadata: { orderId, orderNumber, refundAmount, transactionId }
        });
    }

    // ORDER STATUS UPDATE - Generic
    static async notifyOrderUpdate(userId: string, orderNumber: string, orderId: string, status: string, additionalInfo?: string) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        let title = `Order Update: ${orderNumber}`;
        let message = `Your order #${orderNumber} has been updated to ${status.toLowerCase()}.`;

        if (additionalInfo) {
            message += ` ${additionalInfo}`;
        }

        return this.createNotification({
            userId,
            title,
            message,
            type: 'order',
            link: this.getOrderLink(user?.role || Role.CUSTOMER, orderId),
            metadata: { orderId, orderNumber, status }
        });
    }

    // NEW ORDER - Notify Seller
    static async notifyNewOrder(sellerId: string, orderNumber: string, orderId: string, productName: string, total: number) {
        const seller = await prisma.user.findUnique({ where: { id: sellerId }, select: { role: true } });
        return this.createNotification({
            userId: sellerId,
            title: 'New Order Received! 📦',
            message: `New order #${orderNumber} for "${productName}". Total: ₹${total.toLocaleString()}. Prepare for shipment.`,
            type: 'order',
            link: this.getOrderLink(seller?.role || Role.SELLER, orderId),
            metadata: { orderId, orderNumber, productName }
        });
    }

    // NEW ORDER - Notify Admin
    static async notifyAdminNewOrder(adminId: string, orderNumber: string, orderId: string, customerName: string, total: number) {
        return this.createNotification({
            userId: adminId,
            title: 'New Order Received',
            message: `New order #${orderNumber} from ${customerName}. Total: ₹${total.toLocaleString()}. Review required.`,
            type: 'order',
            link: `/admin/orders/${orderId}`,
            metadata: { orderId, orderNumber, customerName, total }
        });
    }

    // NEWSLETTER - Notify Admin
    static async notifyAdminNewsletterSubscription(adminId: string, email: string) {
        return this.createNotification({
            userId: adminId,
            title: 'New Newsletter Subscription',
            message: `${email} has subscribed to the newsletter.`,
            type: 'info',
            link: '/admin/newsletter',
            metadata: { email }
        });
    }
}
