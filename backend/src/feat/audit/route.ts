import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';
import { AuditController } from './controller';

const router = Router();

router.get('/', authenticate, authorize([Role.ADMIN]), AuditController.listLogs);

export default router;
