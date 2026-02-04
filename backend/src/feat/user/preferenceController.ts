import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class UserPreferenceController {
    static getPreferences = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const userId = user.id;

        const preferences = await prisma.userPreference.findUnique({
            where: { userId }
        });

        if (!preferences) {
            // Create default preferences if they don't exist
            const defaultPrefs = await prisma.userPreference.create({
                data: {
                    userId,
                    emailNotifications: true,
                    orderUpdates: true,
                    marketingEmails: false
                }
            });
            return res.json({ success: true, preferences: defaultPrefs });
        }

        res.json({ success: true, preferences });
    });

    static updatePreferences = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const userId = user.id;
        const { emailNotifications, orderUpdates, marketingEmails } = req.body;

        const preferences = await prisma.userPreference.upsert({
            where: { userId },
            update: {
                emailNotifications,
                orderUpdates,
                marketingEmails
            },
            create: {
                userId,
                emailNotifications: emailNotifications ?? true,
                orderUpdates: orderUpdates ?? true,
                marketingEmails: marketingEmails ?? false
            }
        });

        res.json({ success: true, preferences });
    });
}
