import { Request, Response } from 'express';
import { ComboOfferService } from './service';
import { asyncHandler } from '../../utils/asyncHandler';

export class ComboOfferController {
    static listOffers = asyncHandler(async (req: Request, res: Response) => {
        const comboOffers = await ComboOfferService.getOffers();
        res.json({ success: true, comboOffers });
    });

    static createOffer = asyncHandler(async (req: Request, res: Response) => {
        const offer = await ComboOfferService.createOffer(req.body);
        res.status(201).json({ success: true, data: offer });
    });

    static updateOffer = asyncHandler(async (req: Request, res: Response) => {
        const offer = await ComboOfferService.updateOffer(req.params.id, req.body);
        res.json({ success: true, data: offer });
    });

    static toggleStatus = asyncHandler(async (req: Request, res: Response) => {
        const { active } = req.body;
        const offer = await ComboOfferService.toggleStatus(req.params.id, active);
        res.json({ success: true, data: offer });
    });

    static deleteOffer = asyncHandler(async (req: Request, res: Response) => {
        await ComboOfferService.deleteOffer(req.params.id);
        res.json({ success: true, message: 'Offer deleted successfully' });
    });
}
