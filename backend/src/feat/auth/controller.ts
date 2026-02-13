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
    const { prisma } = require('../../infra/database/client');
    const vendor = await prisma.vendor.findUnique({
        where: { ownerId: req.user.id },
        select: { id: true, storeName: true, slug: true, status: true }
    });

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
            dateOfBirth: req.user.dateOfBirth,
            vendor: vendor
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
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const result = await AuthService.generateResetToken(email);
    res.json(result);
});

export const confirmReset = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    const result = await AuthService.resetPassword({ token, newPassword });
    res.json(result);
});
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await AuthService.changePassword(user.id, req.body);

    await AuditService.logAction({
        performedBy: user.id,
        performerRole: user.role,
        performerEmail: user.email,
        entity: 'User',
        entityId: user.id,
        action: AuditAction.UPDATE,
        reason: `User changed password`
    });

    res.json(result);
});
