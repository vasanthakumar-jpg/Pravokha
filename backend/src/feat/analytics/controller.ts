import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './service';
import { Role } from '@prisma/client';
import { isSuperAdmin, isAdmin, isSeller } from '../../shared/utils/role.utils';

export class AnalyticsController {
    static async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;

            if (isSuperAdmin(user.role) || isAdmin(user.role)) {
                const stats = await AnalyticsService.getPlatformStats();
                return res.status(200).json({ success: true, data: stats });
            }

            if (isSeller(user.role)) {
                const stats = await AnalyticsService.getSellerStats(user.id);
                return res.status(200).json({ success: true, data: stats });
            }

            res.status(403).json({ success: false, message: 'Unauthorized' });
        } catch (error) {
            next(error);
        }
    }
}
