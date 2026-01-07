import { Router } from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validation';
import { createProductSchema, updateProductSchema } from '../../shared/validation/product.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate); // Protect all routes

router.post('/', authorize([Role.DEALER, Role.ADMIN]), validate({ body: createProductSchema }), createProduct);
router.get('/', authorize([Role.DEALER, Role.ADMIN, Role.USER]), getProducts); // Users can view products too
router.get('/:id', authorize([Role.DEALER, Role.ADMIN, Role.USER]), getProductById);
router.put('/:id', authorize([Role.DEALER, Role.ADMIN]), validate({ body: updateProductSchema }), updateProduct);
router.delete('/:id', authorize([Role.DEALER, Role.ADMIN]), deleteProduct);

export default router;
