import { Router } from 'express';
import { NotificationController } from './controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.get('/', authenticate, NotificationController.listNotifications);
router.patch('/:id/read', authenticate, NotificationController.markRead);
router.patch('/read-all', authenticate, NotificationController.markAllRead);
router.delete('/:id', authenticate, NotificationController.deleteNotification);

export default router;
