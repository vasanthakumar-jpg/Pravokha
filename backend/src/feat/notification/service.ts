import { prisma } from '../../infra/database/client';

export class NotificationService {
    static async createNotification(data: {
        userId: string;
        title: string;
        message: string;
        type: 'order' | 'info' | 'alert' | 'message';
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

    static async notifyOrderUpdate(userId: string, orderNumber: string, status: string, additionalInfo?: string) {
        let title = `Order Update: ${orderNumber}`;
        let message = `Your order ${orderNumber} has been updated to ${status.toLowerCase()}.`;

        if (additionalInfo) {
            message += ` ${additionalInfo}`;
        }

        return this.createNotification({
            userId,
            title,
            message,
            type: 'order',
            link: `/orders` // More specific link can be added if order.id is available, but /orders is a good fallback. 
            // Actually, we usually want specific order detail, let's see where this is called.
        });
    }

    static async notifyNewOrder(sellerId: string, orderNumber: string) {
        return this.createNotification({
            userId: sellerId,
            title: 'New Order Received',
            message: `You have received a new order ${orderNumber}. Please review and pack the items.`,
            type: 'order',
            link: '/seller/orders'
        });
    }
}
