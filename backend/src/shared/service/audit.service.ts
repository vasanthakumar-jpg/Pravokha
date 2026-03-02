import { prisma } from '../../infra/database/client';
import { Role } from '@prisma/client';

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    ACCESS = 'ACCESS',
    SUSPEND = 'SUSPEND',
    UNSUSPEND = 'UNSUSPEND',
    UNAUTHORIZED_ATTEMPT = 'UNAUTHORIZED_ATTEMPT'
}

export class AuditService {
    /**
     * Generic logging function
     */
    static async logAction(params: {
        performedBy: string;
        performerRole: Role;
        performerEmail?: string;
        action: string;
        entity: string;
        entityId: string;
        changes?: Record<string, any>;
        reason?: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        try {
            await prisma.auditLog.create({
                data: {
                    performedBy: params.performedBy,
                    performerRole: params.performerRole,
                    performerEmail: params.performerEmail,
                    action: params.action,
                    entity: params.entity,
                    entityId: params.entityId,
                    changes: params.changes ? JSON.parse(JSON.stringify(params.changes)) : undefined,
                    reason: params.reason,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent
                }
            });
        } catch (error) {
            console.error('[AuditService] Failed to create audit log:', error);
        }
    }

    /**
     * Specialized log for sensitive resource edits
     */
    static async logResourceEdit(
        actor: { id: string; role: Role; email: string },
        resourceType: string,
        resourceId: string,
        oldValues: Record<string, any>,
        newValues: Record<string, any>,
        reason: string,
        ipAddress?: string
    ) {
        const changes: Record<string, { before: any; after: any }> = {};

        for (const key in newValues) {
            if (newValues[key] !== oldValues[key]) {
                changes[key] = {
                    before: oldValues[key],
                    after: newValues[key]
                };
            }
        }

        if (Object.keys(changes).length > 0) {
            await this.logAction({
                performedBy: actor.id,
                performerRole: actor.role,
                performerEmail: actor.email,
                action: `EDIT_${resourceType.toUpperCase()}`,
                entity: resourceType,
                entityId: resourceId,
                changes,
                reason,
                ipAddress
            });
        }
    }

    /**
     * Log unauthorized attempts
     */
    static async logUnauthorizedAttempt(
        user: { id: string; role: Role; email: string },
        action: string,
        resource: string,
        resourceId?: string,
        ipAddress?: string
    ) {
        await this.logAction({
            performedBy: user.id,
            performerRole: user.role,
            performerEmail: user.email,
            action: AuditAction.UNAUTHORIZED_ATTEMPT,
            entity: resource,
            entityId: resourceId || 'N/A',
            reason: `Attempted to perform ${action} on ${resource}`,
            ipAddress
        });
    }

    /**
     * List audit logs with filtering and pagination
     */
    static async listLogs(options: {
        skip?: number;
        take?: number;
        actionType?: string;
        severity?: string;
        searchQuery?: string;
        fromDate?: Date;
        toDate?: Date;
    }) {
        const where: any = {};

        if (options.actionType && options.actionType !== 'all') {
            where.action = options.actionType;
        }

        if (options.searchQuery) {
            where.OR = [
                { performerEmail: { contains: options.searchQuery, mode: 'insensitive' } },
                { entityId: { contains: options.searchQuery, mode: 'insensitive' } },
                { reason: { contains: options.searchQuery, mode: 'insensitive' } }
            ];
        }

        if (options.fromDate || options.toDate) {
            where.createdAt = {};
            if (options.fromDate) where.createdAt.gte = options.fromDate;
            if (options.toDate) where.createdAt.lte = options.toDate;
        }

        return await prisma.auditLog.findMany({
            where,
            skip: options.skip || 0,
            take: options.take || 20,
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Count total logs matching filters
     */
    static async countLogs(options: any) {
        const where: any = {};

        if (options.actionType && options.actionType !== 'all') {
            where.action = options.actionType;
        }

        if (options.searchQuery) {
            where.OR = [
                { performerEmail: { contains: options.searchQuery, mode: 'insensitive' } },
                { entityId: { contains: options.searchQuery, mode: 'insensitive' } },
                { reason: { contains: options.searchQuery, mode: 'insensitive' } }
            ];
        }

        if (options.fromDate || options.toDate) {
            where.createdAt = {};
            if (options.fromDate) where.createdAt.gte = options.fromDate;
            if (options.toDate) where.createdAt.lte = options.toDate;
        }

        return await prisma.auditLog.count({ where });
    }
}
