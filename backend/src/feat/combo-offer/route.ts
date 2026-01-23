import { Router } from 'express';
import { ComboOfferController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';

const router = Router();

// Public route to list active offers (for frontend home/offers page)
router.get('/', ComboOfferController.listOffers);

// Admin-only routes
router.post('/', authenticate, authorize(['ADMIN']), ComboOfferController.createOffer);
router.put('/:id', authenticate, authorize(['ADMIN']), ComboOfferController.updateOffer);
router.patch('/:id/status', authenticate, authorize(['ADMIN']), ComboOfferController.toggleStatus);
router.delete('/:id', authenticate, authorize(['ADMIN']), ComboOfferController.deleteOffer);

export default router;
