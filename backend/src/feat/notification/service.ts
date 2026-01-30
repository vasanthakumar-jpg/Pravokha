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
        return await prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                link: data.link,
                metadata: data.metadata,
                isRead: false
            } as any
        });
    }

    // Helper to get role-based message link
    private static getMessageLink(role: Role): string {
        switch (role) {
            case 'ADMIN': return '/admin/messages';
            case 'DEALER': return '/seller/messages';
            case 'USER': return '/user/messages';
            default: return '/user/messages';
        }
    }

    // Helper to get role-based order link
    private static getOrderLink(role: Role, orderId?: string): string {
        const base = role === Role.ADMIN ? '/admin/orders' : role === Role.DEALER ? '/seller/orders' : '/user/orders';
        if (orderId) {
            // ALWAYS navigate to detail/timeline page for Users
            if (role === Role.USER) return `/user/orders/detail/${orderId}`;
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
            link: this.getOrderLink(user?.role || 'USER', orderId),
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
            link: this.getOrderLink(user?.role || 'USER', orderId),
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
            link: this.getOrderLink(user?.role || 'USER', orderId),
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
            link: this.getOrderLink(user?.role || 'USER', orderId),
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
            link: this.getOrderLink(seller?.role || 'DEALER', orderId),
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

    // CONTACT FORM - Notify Admin
    static async notifyAdminContactForm(adminId: string, data: { name: string, email: string, phone: string, subject: string, message: string }) {
        return this.createNotification({
            userId: adminId,
            title: 'New Contact Form Submission',
            message: `Subject: ${data.subject} | From: ${data.name} (${data.email})`,
            type: 'alert',
            link: '/admin/messages',
            metadata: data
        });
    }

    // NEWSLETTER - Notify Admin
    static async notifyAdminNewsletterSubscription(adminId: string, email: string) {
        return this.createNotification({
            userId: adminId,
            title: 'New Newsletter Subscriber',
            message: `A new user has subscribed to the newsletter: ${email}`,
            type: 'info',
            link: '/admin/customers',
            metadata: { email }
        });
    }
}
