import { Router } from 'express';
import { PayoutController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Admin Routes
router.get('/', authenticate, authorize([Role.ADMIN]), PayoutController.listPayouts);
router.patch('/:id/status', authenticate, authorize([Role.ADMIN]), PayoutController.updatePayoutStatus);
router.get('/stats', authenticate, authorize([Role.ADMIN]), PayoutController.getStats);

export default router;
