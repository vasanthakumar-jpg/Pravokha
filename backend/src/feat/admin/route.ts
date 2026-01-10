import { Router } from 'express';
import { AdminController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';

const router = Router();

router.get('/stats', authenticate, authorize(['ADMIN']), AdminController.getStats);
router.get('/reports', authenticate, authorize(['ADMIN']), AdminController.getReports);
router.get('/settings/site', authenticate, authorize(['ADMIN']), AdminController.getSiteSettings);
router.patch('/settings/site', authenticate, authorize(['ADMIN']), AdminController.updateSiteSettings);
router.get('/settings/notifications', authenticate, authorize(['ADMIN']), AdminController.getNotificationSettings);
router.patch('/settings/notifications', authenticate, authorize(['ADMIN']), AdminController.updateNotificationSettings);
router.get('/roles/counts', authenticate, authorize(['ADMIN']), AdminController.getRoleCounts);
router.get('/product-updates', authenticate, authorize(['ADMIN']), AdminController.listProductUpdateRequests);
router.patch('/product-updates/:id', authenticate, authorize(['ADMIN']), AdminController.handleProductUpdateRequest);

export default router;
