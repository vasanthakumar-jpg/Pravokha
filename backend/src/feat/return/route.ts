import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { ReturnController } from './controller';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/request', ReturnController.createRequest);
router.get('/', ReturnController.getRequests);

// Admin/Super Admin routes
router.patch('/:id/approve', authorize([Role.ADMIN, Role.SUPER_ADMIN]), ReturnController.approveRequest);
router.patch('/:id/reject', authorize([Role.ADMIN, Role.SUPER_ADMIN]), ReturnController.rejectRequest);
router.post('/:id/refund', authorize([Role.SUPER_ADMIN]), ReturnController.processRefund);

export default router;
