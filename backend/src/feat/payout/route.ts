import { Router } from 'express';
import { PayoutController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Admin & Seller Routes
router.get('/', authenticate, authorize([Role.ADMIN, Role.DEALER]), PayoutController.listPayouts);
router.post('/request', authenticate, authorize([Role.DEALER]), PayoutController.requestPayout);
router.get('/transactions', authenticate, authorize([Role.DEALER]), PayoutController.getTransactions);
router.patch('/:id/status', authenticate, authorize([Role.ADMIN]), PayoutController.updatePayoutStatus);
router.get('/stats', authenticate, authorize([Role.ADMIN, Role.DEALER]), PayoutController.getStats);

export default router;
