import { Router } from 'express';
import { ComboOfferController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Public route to list active offers (for frontend home/offers page)
router.get('/', ComboOfferController.listOffers);

// Admin-only routes
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), ComboOfferController.createOffer);
router.put('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), ComboOfferController.updateOffer);
router.patch('/:id/status', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), ComboOfferController.toggleStatus);
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), ComboOfferController.deleteOffer);

export default router;
