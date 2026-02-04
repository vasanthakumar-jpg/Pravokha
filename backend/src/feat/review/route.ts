import { Router } from 'express';
import { ReviewController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/admin', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), ReviewController.listAllReviews);
router.get('/product/:productId', ReviewController.listProductReviews);
router.post('/', authenticate, ReviewController.createReview);
router.patch('/:id', authenticate, ReviewController.updateReview);
router.patch('/:id/status', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), ReviewController.updateReviewStatus);
router.delete('/:id', authenticate, ReviewController.deleteReview);

export default router;
