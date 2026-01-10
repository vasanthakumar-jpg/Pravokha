import { OrderController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Create Order (Protected)
router.post('/', authenticate, OrderController.createOrder);

// Get specific order (Protected)
router.get('/:id', authenticate, OrderController.getOrder);

// List user orders (Protected)
router.get('/', authenticate, OrderController.listOrders);

// Cancel order (Protected)
router.post('/:id/cancel', authenticate, OrderController.cancelOrder);

// Admin Routes
router.patch('/:id/status', authenticate, authorize([Role.ADMIN]), OrderController.updateStatus);
router.patch('/:id/refund', authenticate, authorize([Role.ADMIN]), OrderController.refundOrder);
router.delete('/:id', authenticate, authorize([Role.ADMIN]), OrderController.deleteOrder);
router.post('/:id/restore', authenticate, authorize([Role.ADMIN]), OrderController.restoreOrder);

export default router;
