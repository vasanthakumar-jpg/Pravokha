import { Request, Response } from 'express';
import { AuthService } from './service';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuditService, AuditAction } from '../../shared/service/audit.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
    // Data is already validated by middleware
    const result = await AuthService.register(req.body);

    await AuditService.log({
        actorId: result.user.id,
        targetType: 'User',
        targetId: result.user.id,
        actionType: AuditAction.CREATE,
        description: `New user registered: ${req.body.email}`
    });

    res.status(201).json({ success: true, ...result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    // Data is already validated by middleware
    const result = await AuthService.login(req.body);

    await AuditService.log({
        actorId: result.user.id,
        targetType: 'User',
        targetId: result.user.id,
        actionType: AuditAction.LOGIN,
        description: `User logged in: ${req.body.email}`
    });

    res.status(200).json({ success: true, ...result });
});
