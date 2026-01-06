import { Router } from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate); // Protect all routes

router.post('/', authorize(['DEALER', 'ADMIN']), createProduct);
router.get('/', authorize(['DEALER', 'ADMIN']), getProducts);
router.get('/:id', authorize(['DEALER', 'ADMIN']), getProductById);
router.put('/:id', authorize(['DEALER', 'ADMIN']), updateProduct);
router.delete('/:id', authorize(['DEALER', 'ADMIN']), deleteProduct);

export default router;
