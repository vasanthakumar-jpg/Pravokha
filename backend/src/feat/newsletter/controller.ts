import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export const subscribeToNewsletter = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    try {
        await prisma.newsletterSubscription.create({
            data: { email: email.toLowerCase().trim() }
        });

        // Notify Admins
        try {
            const { NotificationService } = await import('../notification/service');
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            });

            for (const admin of admins) {
                await NotificationService.notifyAdminNewsletterSubscription(admin.id, email);
            }
        } catch (err) {
            console.error('Failed to notify admins of newsletter subscription:', err);
        }

        res.status(201).json({ success: true, message: 'Subscribed successfully' });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(200).json({ success: true, message: 'Already subscribed' });
        }
        throw error;
    }
});
