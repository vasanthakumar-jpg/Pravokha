import { Router } from 'express';
import { ComboOfferController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/combo-offers', ComboOfferController.listComboOffers);
router.post('/combo-offers', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), ComboOfferController.createComboOffer);
router.delete('/combo-offers/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), ComboOfferController.deleteComboOffer);

export default router;
