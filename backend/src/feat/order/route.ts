import { OrderController } from './controller';
import { authenticate, authorize, checkAccountStatus } from '../../shared/middleware/auth';
import { requireSellerOrderAccess, requireOrderOwnership } from '../../shared/middleware/ownership';
import { Role } from '@prisma/client';
import { Router } from 'express';

const router = Router();

// Protected routes (Logged in users)
router.use(authenticate);
router.use(checkAccountStatus);

// List orders (Filtered by role in controller)
router.get('/', OrderController.listOrders);

// Create order
router.post('/', OrderController.createOrder);

// Get order stats
router.get('/stats', OrderController.getStats);

// Get specific order
router.get('/:id', requireSellerOrderAccess, OrderController.getOrder);

// Get order history
router.get('/:id/history', OrderController.getHistory);

// Cancel order
router.post('/:id/cancel', OrderController.cancelOrder);

// Admin & Vendor Status Management
router.patch('/:id/status', authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER]), requireOrderOwnership, OrderController.updateStatus);
router.patch('/:id/items/:itemId/status', authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER]), requireOrderOwnership, OrderController.updateItemStatus);
router.post('/:id/ship', authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER]), requireOrderOwnership, OrderController.ship);

// Admin Specific Routes
router.patch('/:id/refund', authorize([Role.SUPER_ADMIN]), OrderController.refundOrder);
router.delete('/:id', authorize([Role.SUPER_ADMIN]), OrderController.deleteOrder);
router.post('/:id/restore', authorize([Role.SUPER_ADMIN]), OrderController.restoreOrder);

export default router;
