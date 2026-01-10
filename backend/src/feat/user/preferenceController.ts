import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class PreferenceController {
    static getPreferences = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        let preferences = await prisma.userPreference.findUnique({
            where: { userId }
        });

        // If no preferences exist, create default ones
        if (!preferences) {
            preferences = await prisma.userPreference.create({
                data: {
                    userId,
                    emailNotifications: true,
                    orderUpdates: true,
                    marketingEmails: false,
                    smsNotifications: false,
                    theme: 'system',
                    language: 'en',
                    currency: 'INR'
                }
            });
        }

        res.json({
            success: true,
            preferences
        });
    });

    static updatePreferences = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const updates = req.body;

        const preferences = await prisma.userPreference.upsert({
            where: { userId },
            update: updates,
            create: {
                userId,
                ...updates
            }
        });

        res.json({
            success: true,
            preferences
        });
    });
}
