import { Router } from 'express';
import { EmailController } from './controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.post('/send', authenticate, EmailController.send);

export default router;
