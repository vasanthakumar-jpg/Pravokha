import { Router } from 'express';
import { ReportController } from './controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.get('/orders', authenticate, ReportController.getOrdersReport);

export default router;
