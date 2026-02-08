import {
    getProducts, getProductById, createProduct, updateProduct, deleteProduct, checkSku,
    verifyProduct, featureProduct, createProductUpdateRequest
} from './controller';
import { authenticate, authorize, optionalAuthenticate, checkAccountStatus } from '../../shared/middleware/auth';
import { requireProductOwnership } from '../../shared/middleware/ownership';
import { validate } from '../../shared/middleware/validation';
import { createProductSchema, updateProductSchema } from '../../shared/validation/product.schema';
import { Role } from '@prisma/client';
import { Router } from 'express';

const router = Router();

// Public routes (but aware of auth user if present)
router.get('/', optionalAuthenticate, getProducts);
router.get('/:id', optionalAuthenticate, getProductById);

// Protected routes
router.use(authenticate);

router.post('/check-sku', checkAccountStatus, checkSku);
router.post('/requests', authorize([Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER]), checkAccountStatus, createProductUpdateRequest);
router.post('/', authorize([Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER]), checkAccountStatus, validate({ body: createProductSchema }), createProduct);
router.put('/:id', authorize([Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER]), checkAccountStatus, requireProductOwnership, validate({ body: updateProductSchema }), updateProduct);
router.patch('/:id', authorize([Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER]), checkAccountStatus, requireProductOwnership, validate({ body: updateProductSchema }), updateProduct);
router.delete('/:id', authorize([Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER]), checkAccountStatus, requireProductOwnership, deleteProduct);

export default router;
