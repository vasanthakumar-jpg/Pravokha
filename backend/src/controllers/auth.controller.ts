import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { registerSchema, loginSchema } from '../utils/validation';

export const register = asyncHandler(async (req: Request, res: Response) => {
    // Validate request
    const validated = registerSchema.parse({ body: req.body });

    const result = await AuthService.register(validated.body);
    res.status(201).json({ success: true, ...result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const validated = loginSchema.parse({ body: req.body });

    const result = await AuthService.login(validated.body);
    res.status(200).json({ success: true, ...result });
});
