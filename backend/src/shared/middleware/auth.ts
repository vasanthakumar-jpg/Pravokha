import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infra/database/client';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: Role;
        email: string;
        name?: string;
        phone?: string | null;
        status?: string;
        verificationStatus?: string | null;
        verificationComments?: string | null;
        avatarUrl?: string | null;
        bio?: string | null;
        dateOfBirth?: Date | null;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phoneNumber: true,
                status: true,
                avatarUrl: true,
                bio: true,
                dateOfBirth: true,
                vendor: {
                    select: {
                        status: true,
                        storeName: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            role: user.role,
            phone: user.phoneNumber,
            status: user.status,
            verificationStatus: user.vendor?.status || null,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            dateOfBirth: user.dateOfBirth
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phoneNumber: true,
                status: true,
                avatarUrl: true,
                bio: true,
                dateOfBirth: true,
                vendor: {
                    select: {
                        status: true,
                        storeName: true
                    }
                }
            }
        });

        if (user) {
            req.user = {
                id: user.id,
                email: user.email,
                name: user.name || undefined,
                role: user.role,
                phone: user.phoneNumber,
                status: user.status,
                verificationStatus: user.vendor?.status || null,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                dateOfBirth: user.dateOfBirth
            };
        }

        next();
    } catch (error) {
        // Continue without user
        next();
    }
};

export const authorize = (roles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Permission denied: Insufficient role' });
        }

        next();
    };
};

/**
 * Middleware to block users if their account status is not 'active'
 */
export const checkAccountStatus = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.status?.toLowerCase() === 'suspended') {
        return res.status(403).json({
            success: false,
            message: 'Your account has been suspended. Please contact support for more information.',
            code: 'ACCOUNT_SUSPENDED'
        });
    }

    next();
};
