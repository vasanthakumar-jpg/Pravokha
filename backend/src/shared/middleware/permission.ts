import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../../feat/auth/permission.service';
import { AuditService } from '../service/audit.service';
import { Role } from '@prisma/client';

export const requirePermission = (action: string, resource: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const userId = req.user.id;
            const userRole = req.user.role as Role;

            // Determine resource owner if applicable based on route params
            // This is a simplified check; complex ownership logic might need DB lookup in controller
            let resourceOwnerId: string | undefined;

            if (req.params.id && resource === 'USER') {
                resourceOwnerId = req.params.id;
            }

            // For products/orders, we might need to fetch the resource to know the owner
            // In a real middleware, we might need a way to inject a "fetchOwner" function
            // For now, we'll let the controller handle specific ownership checks if this general check passes basics

            const hasPermission = await PermissionService.canPerform(
                userId,
                userRole,
                action,
                resource,
                resourceOwnerId
            );

            if (!hasPermission) {
                // Log unauthorized attempt
                await AuditService.logUnauthorizedAttempt(
                    { id: userId, role: userRole, email: req.user.email || 'unknown' },
                    action,
                    resource,
                    req.params.id,
                    req.ip
                );

                return res.status(403).json({
                    message: 'You do not have permission to perform this action',
                    required: `${action} on ${resource}`
                });
            }

            next();
        } catch (error) {
            console.error('Permission check failed:', error);
            res.status(500).json({ message: 'Internal server error during permission check' });
        }
    };
};
