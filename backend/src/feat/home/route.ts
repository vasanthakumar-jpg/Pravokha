import { Router } from 'express';
import { ComboOfferController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/combo-offers', ComboOfferController.listComboOffers);
router.post('/combo-offers', authenticate, authorize([Role.ADMIN]), ComboOfferController.createComboOffer);
router.delete('/combo-offers/:id', authenticate, authorize([Role.ADMIN]), ComboOfferController.deleteComboOffer);

export default router;
