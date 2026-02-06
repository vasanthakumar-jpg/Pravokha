import { Router } from 'express';
import { CategoryController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Category routes
router.get('/', CategoryController.listCategories);
router.get('/admin/all', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), CategoryController.listAllCategories);
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), CategoryController.createCategory);
router.patch('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), CategoryController.updateCategory);
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), CategoryController.deleteCategory);
router.patch('/reorder', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), CategoryController.reorderCategories);
router.get('/subcategories', CategoryController.listAllSubcategories);
router.post('/subcategories', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), CategoryController.createSubcategory);
router.patch('/subcategories/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), CategoryController.updateSubcategory);
router.delete('/subcategories/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), CategoryController.deleteSubcategory);

export default router;
