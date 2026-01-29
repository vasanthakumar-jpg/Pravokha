import { Role } from '@prisma/client';
import { prisma } from '../../infra/database/client';

export class AuditService {
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
            where.actionType = options.actionType;
        }

        if (options.severity && options.severity !== 'all') {
            where.severity = options.severity;
        }

        if (options.fromDate || options.toDate) {
            where.createdAt = {};
            if (options.fromDate) where.createdAt.gte = options.fromDate;
            if (options.toDate) where.createdAt.lte = options.toDate;
        }

        if (options.searchQuery) {
            where.OR = [
                { description: { contains: options.searchQuery } },
                { actor: { name: { contains: options.searchQuery } } },
                { actor: { email: { contains: options.searchQuery } } }
            ];
        }

        return await prisma.auditLog.findMany({
            where,
            skip: options.skip,
            take: options.take || 10,
            orderBy: { createdAt: 'desc' },
            include: {
                actor: {
                    select: {
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });
    }

    static async countLogs(options: {
        actionType?: string;
        severity?: string;
        searchQuery?: string;
        fromDate?: Date;
        toDate?: Date;
    }) {
        const where: any = {};

        if (options.actionType && options.actionType !== 'all') {
            where.actionType = options.actionType;
        }

        if (options.severity && options.severity !== 'all') {
            where.severity = options.severity;
        }

        if (options.fromDate || options.toDate) {
            where.createdAt = {};
            if (options.fromDate) where.createdAt.gte = options.fromDate;
            if (options.toDate) where.createdAt.lte = options.toDate;
        }

        if (options.searchQuery) {
            where.OR = [
                { description: { contains: options.searchQuery } },
                { actor: { name: { contains: options.searchQuery } } },
                { actor: { email: { contains: options.searchQuery } } }
            ];
        }

        return await prisma.auditLog.count({ where });
    }

    static async createLog(data: {
        actorId?: string;
        targetId?: string;
        targetType: string;
        actionType: string;
        severity?: string;
        description?: string;
        metadata?: any;
    }) {
        return await prisma.auditLog.create({
            data: {
                actorId: data.actorId,
                targetId: data.targetId,
                targetType: data.targetType,
                actionType: data.actionType,
                severity: data.severity || 'info',
                description: data.description,
                metadata: data.metadata
            }
        });
    }
}
