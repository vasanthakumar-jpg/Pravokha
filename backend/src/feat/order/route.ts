import { OrderController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { requireDealerOrderAccess, requireOrderOwnership } from '../../shared/middleware/ownership';
import { Role } from '@prisma/client';
import { Router } from 'express';

const router = Router();

// Create Order (Protected)
router.post('/', authenticate, OrderController.createOrder);

// Get order stats (Protected)
router.get('/stats', authenticate, OrderController.getStats);

// Get specific order (Protected)
router.get('/:id', authenticate, OrderController.getOrder);

// List user orders (Protected)
router.get('/', authenticate, OrderController.listOrders);

// Cancel order (Protected)
router.post('/:id/cancel', authenticate, OrderController.cancelOrder);

// Dealer Specific Order Routes (Multi-vendor isolation)
router.get('/dealer/my-sales', authenticate, authorize([Role.DEALER]), OrderController.listOrders);
router.get('/dealer/:id', authenticate, authorize([Role.DEALER]), requireDealerOrderAccess, OrderController.getOrder);


// Admin & Dealer Status Management
router.patch('/:id/status', authenticate, authorize([Role.ADMIN, Role.DEALER]), requireOrderOwnership, OrderController.updateStatus);
router.post('/:id/ship', authenticate, authorize([Role.DEALER]), requireOrderOwnership, OrderController.ship);

// Admin Specific Routes
router.patch('/:id/refund', authenticate, authorize([Role.ADMIN]), OrderController.refundOrder);
router.delete('/:id', authenticate, authorize([Role.ADMIN]), OrderController.deleteOrder);
router.post('/:id/restore', authenticate, authorize([Role.ADMIN]), OrderController.restoreOrder);

export default router;
