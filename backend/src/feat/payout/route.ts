import { Router } from 'express';
import { PayoutController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Admin & Seller Routes
router.get('/', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER]), PayoutController.listPayouts);
router.post('/request', authenticate, authorize([Role.SELLER]), PayoutController.requestPayout);
router.get('/transactions', authenticate, authorize([Role.SELLER]), PayoutController.getTransactions);
router.patch('/:id/status', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), PayoutController.updatePayoutStatus);
router.get('/stats', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER]), PayoutController.getStats);

export default router;
