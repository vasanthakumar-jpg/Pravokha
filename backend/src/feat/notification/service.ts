import { prisma } from '../../infra/database/client';

export class NotificationService {
    static async createNotification(data: {
        userId: string;
        title: string;
        message: string;
        type: 'order' | 'info' | 'alert';
    }) {
        return await prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                isRead: false
            }
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
            type: 'order'
        });
    }

    static async notifyNewOrder(sellerId: string, orderNumber: string) {
        return this.createNotification({
            userId: sellerId,
            title: 'New Order Received',
            message: `You have received a new order ${orderNumber}. Please review and pack the items.`,
            type: 'order'
        });
    }
}
