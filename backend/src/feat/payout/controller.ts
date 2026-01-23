import { Request, Response, NextFunction } from 'express';
import { PayoutService } from './service';

export class PayoutController {
    static async listPayouts(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const payouts = await PayoutService.listPayouts(user.role, user.id);

            res.status(200).json({
                success: true,
                data: payouts,
            });
        } catch (error) {
            next(error);
        }
    }

    static async updatePayoutStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, rejectionReason } = req.body;
            const user = (req as any).user;

            const payout = await PayoutService.updatePayoutStatus(id, status, rejectionReason, user.role);

            res.status(200).json({
                success: true,
                message: 'Payout status updated successfully',
                data: payout,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const stats = await PayoutService.getPayoutStats(user.role);

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }
}
