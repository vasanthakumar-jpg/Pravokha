import { Router } from 'express';
import { WishlistController } from './controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.get('/', authenticate, WishlistController.getWishlist);
router.get('/status', authenticate, WishlistController.checkStatus);
router.get('/check/:productId', authenticate, WishlistController.checkStatus);
router.post('/', authenticate, WishlistController.addToWishlist);
router.delete('/:id', authenticate, WishlistController.removeFromWishlist);
router.delete('/', authenticate, WishlistController.clearWishlist);

export default router;
