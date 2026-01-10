import { Router } from 'express';
import { register, login, getMe } from './controller';
import { validate } from '../../shared/middleware/validation';
import { registerSchema, loginSchema } from '../../shared/validation/auth.schema';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.get('/me', authenticate, getMe);

export default router;
