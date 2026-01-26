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

export const getMe = asyncHandler(async (req: any, res: Response) => {
    // req.user is set by authenticate middleware
    res.status(200).json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            avatarUrl: req.user.avatarUrl,
            status: req.user.status,
            verificationStatus: req.user.verificationStatus
        }
    });
});

export const passwordReset = asyncHandler(async (req: Request, res: Response) => {
    // In a real app, send email with reset token
    // For now, verify email exists and return success
    const { email } = req.body;
    // const user = await prisma.user.findUnique({ where: { email } });
    // if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Allow simulation even without checking DB if needed, or strictly check
    res.json({ success: true, message: 'Reset instruction sent (Simulation)' });
});
