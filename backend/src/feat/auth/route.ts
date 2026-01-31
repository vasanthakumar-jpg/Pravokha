import { Router } from 'express';
import { register, login, getMe, passwordReset, googleLogin } from './controller';
import { validate } from '../../shared/middleware/validation';
import { registerSchema, loginSchema } from '../../shared/validation/auth.schema';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/google-login', googleLogin);
router.post('/password-reset', passwordReset);
router.get('/me', authenticate, getMe);

export default router;
