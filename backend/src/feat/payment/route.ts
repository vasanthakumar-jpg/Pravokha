import { Router } from 'express';
import { PaymentController } from './controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.get('/methods', authenticate, PaymentController.listPaymentMethods);
router.post('/methods', authenticate, PaymentController.addPaymentMethod);
router.delete('/methods/:id', authenticate, PaymentController.deletePaymentMethod);

export default router;
