import { Router } from 'express';
import { subscribeToNewsletter } from './controller';

const router = Router();

router.post('/subscribe', subscribeToNewsletter);

export default router;
