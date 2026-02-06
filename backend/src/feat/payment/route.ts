import { Router } from 'express';
import { PaymentController } from './controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.get('/methods', authenticate, PaymentController.listPaymentMethods);
router.post('/methods', authenticate, PaymentController.addPaymentMethod);
router.delete('/methods/:id', authenticate, PaymentController.deletePaymentMethod);

// New payment endpoints
router.get('/settings', PaymentController.getPublicSettings);
router.post('/create-intent', authenticate, PaymentController.createPaymentIntent);
router.post('/create-razorpay-order', authenticate, PaymentController.createPaymentIntent);
router.post('/verify-payment', authenticate, PaymentController.verifyPayment);
router.post('/refund/:orderId', authenticate, PaymentController.refundOrder);
router.get('/status/:orderId', authenticate, PaymentController.getPaymentStatus);

export default router;
