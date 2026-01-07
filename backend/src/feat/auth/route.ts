import { Router } from 'express';
import { register, login } from './controller';
import { validate } from '../../shared/middleware/validation';
import { registerSchema, loginSchema } from '../../shared/validation/auth.schema';

const router = Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);

export default router;
