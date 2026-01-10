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
        res.status(201).json({ success: true, message: 'Subscribed successfully' });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(200).json({ success: true, message: 'Already subscribed' });
        }
        throw error;
    }
});
