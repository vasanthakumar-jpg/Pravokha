import { Router } from 'express';
import { CategoryController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Category routes
router.get('/', CategoryController.listCategories);
router.post('/', authenticate, authorize([Role.ADMIN]), CategoryController.createCategory);
router.patch('/:id', authenticate, authorize([Role.ADMIN]), CategoryController.updateCategory);
router.delete('/:id', authenticate, authorize([Role.ADMIN]), CategoryController.deleteCategory);

// Subcategory routes
router.get('/subcategories', CategoryController.listSubcategories);
router.post('/subcategories', authenticate, authorize([Role.ADMIN]), CategoryController.createSubcategory);
router.patch('/subcategories/:id', authenticate, authorize([Role.ADMIN]), CategoryController.updateSubcategory);
router.delete('/subcategories/:id', authenticate, authorize([Role.ADMIN]), CategoryController.deleteSubcategory);

export default router;
