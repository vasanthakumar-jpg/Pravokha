
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../core/config/env';
import { prisma } from '../../infra/database/client';
import { Role } from '@prisma/client';

interface JwtPayload {
    id: string;
    role: Role;
}

// Extend Request interface
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: string;
            role: Role;
            email: string;
            name: string | null;
            avatarUrl: string | null;
            verificationStatus: string | null;
            verificationComments: string | null;
            dateOfBirth: Date | string | null;
            phone: string | null;
            bio: string | null;
            status: string;
        };
    }
}

/**
 * Authentication Middleware: Verifies the JWT and attaches the user to the request.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                role: true,
                status: true,
                email: true,
                name: true,
                avatarUrl: true,
                verificationStatus: true,
                verificationComments: true,
                dateOfBirth: true,
                phone: true,
                bio: true
            },
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid authentication: User no longer exists' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Access denied: Your account has been suspended' });
        }

        req.user = {
            id: user.id,
            role: user.role as Role,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            verificationStatus: user.verificationStatus,
            verificationComments: user.verificationComments,
            dateOfBirth: user.dateOfBirth,
            phone: user.phone,
            bio: user.bio,
            status: user.status
        };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Authentication failed: Invalid or expired token' });
    }
};

/**
 * Authorization Middleware: Enforces Role-Based Access Control (RBAC).
 */
export const authorize = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User context missing: Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: This action requires one of the following roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Optional Authentication Middleware: Attempts to verify JWT but doesn't fail if token is missing.
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                role: true,
                status: true,
                email: true,
                name: true,
                avatarUrl: true,
                verificationStatus: true,
                verificationComments: true,
                dateOfBirth: true,
                phone: true,
                bio: true
            },
        });

        if (user && user.status !== 'suspended') {
            req.user = {
                id: user.id,
                role: user.role as Role,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                verificationStatus: user.verificationStatus,
                verificationComments: user.verificationComments,
                dateOfBirth: user.dateOfBirth,
                phone: user.phone,
                bio: user.bio,
                status: user.status
            };
        }

        next();
    } catch (error) {
        // Just proceed without user context if token is invalid
        next();
    }
};
