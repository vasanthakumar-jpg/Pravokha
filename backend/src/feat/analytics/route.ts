import { Router } from 'express';
import { AnalyticsController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/seller', authenticate, authorize([Role.ADMIN]), AnalyticsController.getStats);

export default router;
