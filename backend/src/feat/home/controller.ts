import { Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class ComboOfferController {
    static listComboOffers = asyncHandler(async (req: any, res: Response) => {
        const { activeOnly } = req.query;

        const where: any = {};
        if (activeOnly === 'true') where.active = true;

        const offers = await prisma.comboOffer.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, offers });
    });

    static createComboOffer = asyncHandler(async (req: any, res: Response) => {
        const { title, description, imageUrl, comboPrice, active } = req.body;

        const offer = await prisma.comboOffer.create({
            data: {
                title,
                description,
                imageUrl,
                comboPrice: parseFloat(String(comboPrice)),
                active: active ?? true
            }
        });

        res.status(201).json({ success: true, offer });
    });

    static deleteComboOffer = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        await prisma.comboOffer.delete({ where: { id } });
        res.json({ success: true, message: 'Combo offer deleted' });
    });
}
