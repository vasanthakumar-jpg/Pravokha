import { Request, Response, NextFunction } from 'express';
import { PayoutService } from './service';
import { prisma } from '../../infra/database/client';


export class PayoutController {
    static async listPayouts(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const { skip, take } = req.query;
            const payouts = await PayoutService.listPayouts(
                user.role,
                user.id,
                skip ? parseInt(skip as string) : 0,
                take ? parseInt(take as string) : 10
            );

            res.status(200).json({
                success: true,
                data: payouts,
            });
        } catch (error) {
            next(error);
        }
    }

    static async requestPayout(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const { amount } = req.body;

            const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.id } });
            if (!vendor) return res.status(404).json({ success: false, message: 'Vendor record not found' });

            const payout = await PayoutService.createPayoutRequest(vendor.id, amount);

            res.status(201).json({
                success: true,
                message: 'Payout request submitted successfully',
                data: payout,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTransactions(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;

            const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.id } });
            if (!vendor) return res.status(404).json({ success: false, message: 'Vendor record not found' });

            const transactions = await PayoutService.getTransactions(vendor.id);

            res.status(200).json({
                success: true,
                data: transactions,
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
            const stats = await PayoutService.getPayoutStats(user.role, user.id);

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }
}
