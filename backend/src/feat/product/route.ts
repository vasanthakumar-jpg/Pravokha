import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from './controller';
import { authenticate, authorize, optionalAuthenticate } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validation';
import { createProductSchema, updateProductSchema } from '../../shared/validation/product.schema';
import { Role } from '@prisma/client';

const router = Router();

// Public routes (but aware of auth user if present)
router.get('/', optionalAuthenticate, getProducts);
router.get('/:id', optionalAuthenticate, getProductById);

// Protected routes
router.use(authenticate);

router.post('/', authorize([Role.DEALER, Role.ADMIN]), validate({ body: createProductSchema }), createProduct);
router.put('/:id', authorize([Role.DEALER, Role.ADMIN]), validate({ body: updateProductSchema }), updateProduct);
router.delete('/:id', authorize([Role.DEALER, Role.ADMIN]), deleteProduct);

export default router;
