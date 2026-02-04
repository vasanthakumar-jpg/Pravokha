import { Request, Response } from 'express';
import { AuthService } from './service';
import { asyncHandler } from '../../utils/asyncHandler';
import { GoogleAuthService } from './oauth.service';
import { AuditService, AuditAction } from '../../shared/service/audit.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
    // Data is already validated by middleware
    const result = await AuthService.register(req.body);

    await AuditService.logAction({
        performedBy: result.user.id,
        performerRole: result.user.role,
        performerEmail: result.user.email,
        entity: 'User',
        entityId: result.user.id,
        action: AuditAction.CREATE,
        reason: `New user registered: ${req.body.email}`
    });

    res.status(201).json({ success: true, ...result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    // Data is already validated by middleware
    const result = await AuthService.login(req.body);

    await AuditService.logAction({
        performedBy: result.user.id,
        performerRole: result.user.role,
        performerEmail: result.user.email,
        entity: 'User',
        entityId: result.user.id,
        action: AuditAction.LOGIN,
        reason: `User logged in: ${req.body.email}`
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
            verificationStatus: req.user.verificationStatus,
            verificationComments: req.user.verificationComments,
            phone: req.user.phone,
            bio: req.user.bio,
            dateOfBirth: req.user.dateOfBirth
        }
    });
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    const googleData = await GoogleAuthService.verifyToken(idToken);

    // Ensure types match AuthService.googleLogin
    const result = await AuthService.googleLogin({
        googleId: googleData.googleId,
        email: googleData.email,
        name: googleData.name,
        picture: googleData.picture
    });

    await AuditService.logAction({
        performedBy: result.user.id,
        performerRole: result.user.role,
        performerEmail: result.user.email,
        entity: 'User',
        entityId: result.user.id,
        action: AuditAction.LOGIN,
        reason: `User logged in via Google: ${googleData.email}`
    });

    res.status(200).json({ success: true, ...result });
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
