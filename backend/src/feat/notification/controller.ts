import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class NotificationController {
    static listNotifications = asyncHandler(async (req: any, res: Response) => {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    });

    static markRead = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        await prisma.notification.updateMany({
            where: { id, userId: req.user.id },
            data: { isRead: true }
        });
        res.json({ success: true });
    });

    static markAllRead = asyncHandler(async (req: any, res: Response) => {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    });

    static deleteNotification = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        await prisma.notification.deleteMany({
            where: { id, userId: req.user.id }
        });
        res.json({ success: true });
    });
}
