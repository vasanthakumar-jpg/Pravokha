import { Router } from 'express';
import { register, login, getMe, passwordReset, googleLogin, changePassword, confirmReset } from './controller';
import { validate } from '../../shared/middleware/validation';
import { registerSchema, loginSchema } from '../../shared/validation/auth.schema';
import { changePasswordSchema } from '../../shared/validation/user.schema';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/google-login', googleLogin);
router.post('/password-reset', passwordReset);
router.post('/reset-password', confirmReset);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), changePassword);
router.get('/me', authenticate, getMe);

export default router;
