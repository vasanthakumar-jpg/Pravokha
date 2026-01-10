import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class PaymentController {
    static listPaymentMethods = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const methods = await prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({
            success: true,
            paymentMethods: methods
        });
    });

    static addPaymentMethod = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const {
            cardLast4,
            cardBrand,
            cardExpMonth,
            cardExpYear,
            cardHolderName,
            isDefault,
            type,
            label,
            details
        } = req.body;

        const method = await prisma.$transaction(async (tx) => {
            if (isDefault) {
                // Unset other defaults
                await tx.paymentMethod.updateMany({
                    where: { userId },
                    data: { isDefault: false }
                });
            }

            return tx.paymentMethod.create({
                data: {
                    userId,
                    cardLast4,
                    cardBrand,
                    cardExpMonth,
                    cardExpYear,
                    cardHolderName,
                    isDefault: isDefault || false,
                    type: type || 'card',
                    label: label || 'Personal',
                    details: details || {}
                }
            });
        });

        res.status(201).json({
            success: true,
            paymentMethod: method
        });
    });

    static deletePaymentMethod = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;

        const method = await prisma.paymentMethod.findUnique({
            where: { id }
        });

        if (!method || method.userId !== userId) {
            return res.status(404).json({ success: false, message: 'Payment method not found' });
        }

        await prisma.paymentMethod.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Payment method removed'
        });
    });
}
