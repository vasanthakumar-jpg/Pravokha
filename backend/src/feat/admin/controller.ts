import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuditService, AuditAction } from '../../shared/service/audit.service';
import { PermissionService } from '../auth/permission.service';

const prisma = new PrismaClient();

// PERMISSION MANAGEMENT

export const updateAdminPermissions = asyncHandler(async (req: Request, res: Response) => {
    const { adminId } = req.params;
    const permissions = req.body;

    const adminUser = (req as any).user;
    // Only SUPER_ADMIN can do this
    if (adminUser.role !== Role.SUPER_ADMIN) {
        res.status(403).json({ message: 'Only Super Admin can manage permissions' });
        return;
    }

    const updated = await prisma.adminPermission.upsert({
        where: { adminId },
        update: permissions,
        create: {
            adminId,
            ...permissions
        }
    });

    await AuditService.logAction({
        performedBy: adminUser.id,
        performerRole: Role.SUPER_ADMIN,
        performerEmail: adminUser.email!,
        action: AuditAction.UPDATE,
        entity: 'AdminPermission',
        entityId: updated.id,
        changes: permissions,
        reason: `Updated permissions for admin ${adminId}`,
        ipAddress: req.ip
    });

    res.json({ success: true, data: updated });
});

export const getAdminPermissions = asyncHandler(async (req: Request, res: Response) => {
    const { adminId } = req.params;

    const adminUser = (req as any).user;
    // Allow if SUPER_ADMIN or self
    if (adminUser.role !== Role.SUPER_ADMIN && adminUser.id !== adminId) {
        res.status(403).json({ message: 'Permission denied' });
        return;
    }

    const permissions = await prisma.adminPermission.findUnique({
        where: { adminId }
    });

    res.json({ success: true, data: permissions || {} });
});

// USER MANAGEMENT

export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { reason, duration } = req.body; // duration in days

    if (!reason) {
        res.status(400).json({ message: 'Suspension reason is required' });
        return;
    }

    const expiresAt = duration
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        : null;

    const adminUser = (req as any).user;
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            status: 'suspended',
            suspendedBy: adminUser.id,
            suspendedAt: new Date(),
            suspensionReason: reason,
            suspensionExpiresAt: expiresAt
        }
    });

    await AuditService.logAction({
        performedBy: adminUser.id,
        performerRole: adminUser.role as Role,
        performerEmail: adminUser.email!,
        action: AuditAction.SUSPEND,
        entity: 'User',
        entityId: userId,
        reason: reason,
        ipAddress: req.ip
    });

    // TODO: Send Email

    res.json({ success: true, message: 'User suspended', data: user });
});

export const activateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const adminUser = (req as any).user;
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            status: 'active',
            suspendedBy: null,
            suspendedAt: null,
            suspensionReason: null,
            suspensionExpiresAt: null
        }
    });

    await AuditService.logAction({
        performedBy: adminUser.id,
        performerRole: adminUser.role as Role,
        performerEmail: adminUser.email!,
        action: AuditAction.UNSUSPEND,
        entity: 'User',
        entityId: userId,
        reason: 'User account reactivated',
        ipAddress: req.ip
    });

    res.json({ success: true, message: 'User activated', data: user });
});

// AUDIT LOGS

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 50, action, entity, userId, startDate, endDate } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (userId) where.performedBy = userId;
    if (startDate && endDate) {
        where.createdAt = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
        };
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip,
            include: { user: { select: { name: true, email: true, role: true, avatarUrl: true } } }
        }),
        prisma.auditLog.count({ where })
    ]);

    res.json({
        success: true,
        data: logs,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
        }
    });
});

// DASHBOARD STATS

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    // Basic Counts
    const [
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrders,
        pendingOrders,
        lowStockItems,
        pendingPayouts,
        openTickets,
        pendingVerifications
    ] = await Promise.all([
        prisma.user.count(),
        prisma.vendor.count({ where: { status: 'ACTIVE' } }),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.product.count({ where: { stock: { lte: 10 } } }),
        prisma.payout.count({ where: { status: 'PENDING' } }),
        prisma.supportTicket.count({ where: { status: 'open' } }),
        prisma.vendor.count({ where: { status: 'PENDING' } })
    ]);

    // Financials (Total Revenue)
    const revenueResult = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' }
    });
    const revenue = revenueResult._sum.totalAmount || 0;

    // Sales Trend (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesTrendRaw = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
            createdAt: { gte: sevenDaysAgo },
            paymentStatus: 'PAID'
        },
        _sum: { totalAmount: true }
    });

    // Format trend data (simplified grouping by day in application layer if needed, 
    // or use raw query for date_trunc. For now, simple mapping)
    // Note: Prisma groupBy on DateTime is granular. For dashboard, we usually want daily.
    // Using raw query is better for date truncation, but keeping it simple for now.
    const salesTrend = salesTrendRaw.map(s => ({
        date: s.createdAt.toISOString().split('T')[0],
        sales: s._sum.totalAmount || 0
    }));

    // Top Products
    const topProductsRaw = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
    });

    const topProducts = await Promise.all(topProductsRaw.map(async (item) => {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { title: true }
        });
        return {
            name: product?.title || 'Unknown Product',
            sales: item._sum.quantity || 0
        };
    }));

    res.json({
        success: true,
        stats: {
            totalProducts,
            totalUsers,
            totalSellers,
            totalSales: totalOrders, // Using order count for "Total Sales" count, revenue is separate
            pendingOrders,
            lowStockItems,
            pendingPayouts,
            openTickets,
            pendingVerifications,
            revenue,
            salesTrend,
            topProducts,
            categoryDistribution: [], // Placeholder for now
            revenueGrowth: [] // Placeholder for now
        }
    });
});

// SETTINGS MANAGEMENT

const getOrCreateSettings = async () => {
    let settings = await prisma.siteSetting.findUnique({
        where: { id: 'primary' }
    });

    if (!settings) {
        settings = await prisma.siteSetting.create({
            data: {
                id: 'primary',
                storeName: 'Pravokha',
                storeUrl: 'https://pravokha.com',
                taxRate: 18,
                defaultShippingFee: 99,
                commissionRate: 10
            }
        });
    }
    return settings;
};

export const getSiteSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await getOrCreateSettings();
    res.json({ success: true, settings });
});

export const updateSiteSettings = asyncHandler(async (req: Request, res: Response) => {
    const {
        storeName,
        storeUrl,
        maintenanceMode,
        autoConfirmOrders,
        logoUrl,
        bannerUrl,
        taxRate,
        defaultShippingFee,
        commissionRate
    } = req.body;

    const data: any = {};
    if (storeName !== undefined) data.storeName = storeName;
    if (storeUrl !== undefined) data.storeUrl = storeUrl;
    if (maintenanceMode !== undefined) data.maintenanceMode = maintenanceMode;
    if (autoConfirmOrders !== undefined) data.autoConfirmOrders = autoConfirmOrders;
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (bannerUrl !== undefined) data.bannerUrl = bannerUrl;
    if (taxRate !== undefined) data.taxRate = taxRate;
    if (defaultShippingFee !== undefined) data.defaultShippingFee = defaultShippingFee;
    if (commissionRate !== undefined) data.commissionRate = commissionRate;

    const settings = await prisma.siteSetting.upsert({
        where: { id: 'primary' },
        update: data,
        create: { id: 'primary', ...data }
    });

    const adminUser = (req as any).user;
    await AuditService.logAction({
        performedBy: adminUser.id,
        performerRole: adminUser.role as Role,
        performerEmail: adminUser.email!,
        action: AuditAction.UPDATE,
        entity: 'SiteSetting',
        entityId: 'primary',
        changes: data,
        reason: 'Updated global site settings',
        ipAddress: req.ip
    });

    res.json({ success: true, settings });
});

export const getNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await getOrCreateSettings();
    let notificationSettings = {};
    try {
        notificationSettings = typeof settings.notificationSettings === 'string'
            ? JSON.parse(settings.notificationSettings)
            : settings.notificationSettings || {};
    } catch (e) {
        notificationSettings = {};
    }
    res.json({ success: true, settings: notificationSettings });
});

export const updateNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
    const { governanceAlerts, revenueTelemetry, inventoryCriticality } = req.body;

    // Merge with existing
    const current = await getOrCreateSettings();
    let currentNotifs: any = {};
    try {
        currentNotifs = typeof current.notificationSettings === 'string'
            ? JSON.parse(current.notificationSettings)
            : current.notificationSettings || {};
    } catch (e) {
        currentNotifs = {};
    }

    const newSettings = {
        ...currentNotifs,
        governanceAlerts: governanceAlerts ?? currentNotifs.governanceAlerts,
        revenueTelemetry: revenueTelemetry ?? currentNotifs.revenueTelemetry,
        inventoryCriticality: inventoryCriticality ?? currentNotifs.inventoryCriticality
    };

    const updated = await prisma.siteSetting.update({
        where: { id: 'primary' },
        data: {
            notificationSettings: JSON.stringify(newSettings)
        }
    });

    let updatedNotifs = {};
    try {
        updatedNotifs = typeof updated.notificationSettings === 'string'
            ? JSON.parse(updated.notificationSettings)
            : updated.notificationSettings || {};
    } catch (e) {
        updatedNotifs = {};
    }

    res.json({ success: true, settings: updatedNotifs });
});

export const getSystemSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await getOrCreateSettings();
    let systemSettings = {};
    try {
        systemSettings = typeof settings.systemSettings === 'string'
            ? JSON.parse(settings.systemSettings)
            : settings.systemSettings || {};
    } catch (e) {
        systemSettings = {};
    }
    res.json({ success: true, settings: systemSettings });
});

export const updateSystemSettings = asyncHandler(async (req: Request, res: Response) => {
    const {
        currency,
        timezone,
        analyticsEnabled,
        aiInsightsEnabled,
        payoutAutomationEnabled,
        sessionTrackingEnabled,
        dataAnonymizationEnabled,
        publicIndexingEnabled,
        googleAnalyticsId
    } = req.body;

    // Merge with existing
    const current = await getOrCreateSettings();
    let currentSys: any = {};
    try {
        currentSys = typeof current.systemSettings === 'string'
            ? JSON.parse(current.systemSettings)
            : current.systemSettings || {};
    } catch (e) {
        currentSys = {};
    }

    const newSettings = {
        ...currentSys,
        currency: currency ?? currentSys.currency,
        timezone: timezone ?? currentSys.timezone,
        analyticsEnabled: analyticsEnabled ?? currentSys.analyticsEnabled,
        aiInsightsEnabled: aiInsightsEnabled ?? currentSys.aiInsightsEnabled,
        payoutAutomationEnabled: payoutAutomationEnabled ?? currentSys.payoutAutomationEnabled,
        sessionTrackingEnabled: sessionTrackingEnabled ?? currentSys.sessionTrackingEnabled,
        dataAnonymizationEnabled: dataAnonymizationEnabled ?? currentSys.dataAnonymizationEnabled,
        publicIndexingEnabled: publicIndexingEnabled ?? currentSys.publicIndexingEnabled,
        googleAnalyticsId: googleAnalyticsId ?? currentSys.googleAnalyticsId
    };

    const updated = await prisma.siteSetting.update({
        where: { id: 'primary' },
        data: {
            systemSettings: JSON.stringify(newSettings)
        }
    });

    const adminUser = (req as any).user;
    await AuditService.logAction({
        performedBy: adminUser.id,
        performerRole: adminUser.role as Role,
        performerEmail: adminUser.email!,
        action: AuditAction.UPDATE,
        entity: 'SiteSetting',
        entityId: 'primary',
        changes: newSettings,
        reason: 'Updated global system settings',
        ipAddress: req.ip
    });

    let updatedSys = {};
    try {
        updatedSys = typeof updated.systemSettings === 'string'
            ? JSON.parse(updated.systemSettings)
            : updated.systemSettings || {};
    } catch (e) {
        updatedSys = {};
    }

    res.json({ success: true, settings: updatedSys });
});

// PRODUCT UPDATE REQUESTS

export const getProductUpdateRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await prisma.productUpdateRequest.findMany({
        where: { status: 'pending' },
        include: {
            product: {
                select: {
                    id: true,
                    title: true,
                    sku: true,
                    price: true,
                    compareAtPrice: true,
                    stock: true,
                    description: true,
                    images: true
                }
            },
            seller: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, requests });
});

export const updateProductRequestStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body; // status: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        res.status(400).json({ message: 'Invalid status' });
        return;
    }

    const request = await prisma.productUpdateRequest.findUnique({
        where: { id },
        include: { product: true }
    });

    if (!request) {
        res.status(404).json({ message: 'Request not found' });
        return;
    }

    if (request.status !== 'pending') {
        res.status(400).json({ message: 'Request is already processed' });
        return;
    }

    await prisma.$transaction(async (tx) => {
        // Update request status
        await tx.productUpdateRequest.update({
            where: { id },
            data: {
                status,
                adminNotes,
                updatedAt: new Date()
            }
        });

        // If approved, apply changes to product
        if (status === 'approved') {
            const rawChanges = request.requestedChanges;
            let changes: any = rawChanges;

            // Defensive: Handle case where it might be stored as a string or object
            if (typeof rawChanges === 'string') {
                try {
                    changes = JSON.parse(rawChanges);
                } catch (e) {
                    changes = {};
                }
            }

            const productUpdates = { ...changes };
            delete productUpdates.reason; // Remove 'reason' if it exists in changes (frontend sends it)

            await tx.product.update({
                where: { id: request.productId },
                data: productUpdates
            });

            // Log audit
            const adminUser = (req as any).user;
            await AuditService.logAction({
                performedBy: adminUser.id,
                performerRole: adminUser.role as Role,
                performerEmail: adminUser.email!,
                action: AuditAction.UPDATE,
                entity: 'Product',
                entityId: request.productId,
                changes: productUpdates,
                reason: `Approved product update request ${id}`,
                ipAddress: req.ip
            });
        }
    });

    res.json({ success: true, message: `Request ${status}` });
});

