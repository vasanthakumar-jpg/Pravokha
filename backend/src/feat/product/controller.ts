import { Request, Response } from 'express';
import { ProductService } from './service';
import { asyncHandler } from '../../utils/asyncHandler';
// Use the new AuditService for RBAC logging
import { AuditService } from '../../shared/service/audit.service';
import { Role } from '@prisma/client';
import { prisma } from '../../infra/database/client';

const ADMIN_ONLY_FIELDS = [
    'isVerified',
    'is_verified',
    'isFeatured',
    'is_featured',
    'isBlocked',
    'is_blocked',
    'adminNotes',
    'admin_notes',
    'commissionRate',
    'commission_rate',
    'verifiedBy',
    'verified_by',
    'verifiedAt',
    'verified_at',
    'blockedReason',
    'blocked_reason'
];

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const userRole = user!.role as Role;

    // If vendor tries to set admin fields on creation, strip them or error
    if (userRole === Role.SELLER) {
        for (const field of ADMIN_ONLY_FIELDS) {
            if (req.body[field] !== undefined) {
                delete req.body[field];
            }
        }
        // Force defaults for sellers
        req.body.isVerified = false;
        req.body.isFeatured = false;
        req.body.isBlocked = false;
    }

    const result = await ProductService.createProduct(user!.id, req.body);

    await AuditService.logAction({
        performedBy: user!.id,
        performerRole: userRole,
        performerEmail: user!.email!,
        action: 'CREATE_PRODUCT',
        entity: 'Product',
        entityId: result.id,
        reason: `Product created: ${result.title}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
    });

    res.status(201).json({ success: true, data: result });
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { search, category, page, limit, vendorId, tag, scope } = req.query;
    // Super Admins can see all, Vendors might have restrictions handled in service
    const result = await ProductService.getProducts(user!, {
        search: search as string,
        category: category as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        vendorId: vendorId as string,
        tag: tag as string,
        scope: scope as string
    });
    res.status(200).json({ success: true, ...result });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await ProductService.getProductById(req.params.id, user!);
    res.status(200).json({ success: true, data: result });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const user = (req as any).user;
    const userId = user!.id;
    const userRole = user!.role as Role;

    // 1. Fetch existing product to check ownership and get old values
    const existingProduct = await ProductService.getProductById(productId, user!);
    if (!existingProduct) {
        res.status(404).json({ message: 'Product not found' });
        return;
    }

    // Map vendorId from existing product (it's in the vendor relation)
    const productVendorId = (existingProduct as any).vendorId;

    // Check if user is a vendor and owns this product (Check for ALL roles, not just Role.ADMIN)
    const vendor = await prisma.vendor.findUnique({ where: { ownerId: userId } });
    const isOwner = vendor?.id === productVendorId;

    const isSuperAdmin = userRole === Role.SUPER_ADMIN;
    const isAdmin = userRole === Role.ADMIN;

    // 2. Permission Check
    if (!isOwner && !isSuperAdmin && !isAdmin) {
        res.status(403).json({ message: 'You do not have permission to edit this product' });
        return;
    }

    // 3. Field-Level Protection
    if (!isSuperAdmin && !isAdmin) {
        // Vendor trying to edit admin fields - STRIP THEM instead of 403
        for (const field of ADMIN_ONLY_FIELDS) {
            if (req.body[field] !== undefined) {
                delete req.body[field];
            }
        }
    } else if (!isOwner) {
        // Admin or Super Admin editing another's product - REQUIRE REASON
        const reason = req.body.adminEditReason;
        if (!reason || (typeof reason === 'string' && !reason.trim())) {
            res.status(400).json({ message: 'Admin edit reason is required for cross-seller edits' });
            return;
        }
    }

    // 4. Perform Update
    const result = await ProductService.updateProduct(productId, user!, req.body);

    // 5. Audit Logging
    if (isSuperAdmin && !isOwner) {
        // Admin edited seller product
        await AuditService.logResourceEdit(
            { id: userId, role: userRole, email: user!.email! },
            'Product',
            productId,
            existingProduct,
            result,
            req.body.adminEditReason || 'Super Admin Override',
            req.ip
        );
    } else {
        // Regular update log
        await AuditService.logAction({
            performedBy: userId,
            performerRole: userRole,
            performerEmail: user!.email!,
            action: 'UPDATE_PRODUCT',
            entity: 'Product',
            entityId: productId,
            reason: 'User updated own product',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] as string
        });
    }

    res.status(200).json({ success: true, data: result });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    // Permission check inside service
    await ProductService.deleteProduct(req.params.id, user!);

    await AuditService.logAction({
        performedBy: user!.id,
        performerRole: user!.role as Role,
        performerEmail: user!.email!,
        action: 'DELETE_PRODUCT',
        entity: 'Product',
        entityId: req.params.id,
        reason: 'Product deleted',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
    });

    res.status(200).json({ success: true, message: 'Product deleted' });
});

// Admin Actions ---------------------------------------------------------

export const verifyProduct = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { approved, notes } = req.body;

    // Direct role check
    if (user.role !== Role.SUPER_ADMIN) {
        res.status(403).json({ message: 'Permission denied' });
        return;
    }

    const result = await ProductService.updateProduct(req.params.id, user!, {
        isVerified: approved,
        verifiedBy: user!.id,
        verifiedAt: new Date(),
        adminNotes: notes
    });

    await AuditService.logAction({
        performedBy: user!.id,
        performerRole: user!.role as Role,
        performerEmail: user!.email!,
        action: approved ? 'APPROVE_PRODUCT' : 'REJECT_PRODUCT',
        entity: 'Product',
        entityId: req.params.id,
        changes: { approved, notes },
        reason: notes,
        ipAddress: req.ip
    });

    res.status(200).json({ success: true, data: result });
});

export const featureProduct = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { featured } = req.body;
    const result = await ProductService.updateProduct(req.params.id, user!, { isFeatured: featured });

    await AuditService.logAction({
        performedBy: user!.id,
        performerRole: user!.role as Role,
        performerEmail: user!.email!,
        action: featured ? 'FEATURE_PRODUCT' : 'UNFEATURE_PRODUCT',
        entity: 'Product',
        entityId: req.params.id,
        changes: { featured },
        ipAddress: req.ip
    });

    res.status(200).json({ success: true, data: result });
});

export const blockProduct = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { blocked, reason } = req.body;

    if (blocked && !reason) {
        res.status(400).json({ message: 'Reason is required to block a product' });
        return;
    }

    const result = await ProductService.updateProduct(req.params.id, user!, {
        isBlocked: blocked,
        blockedReason: blocked ? reason : null
    });

    await AuditService.logAction({
        performedBy: user!.id,
        performerRole: user!.role as Role,
        performerEmail: user!.email!,
        action: blocked ? 'BLOCK_PRODUCT' : 'UNBLOCK_PRODUCT',
        entity: 'Product',
        entityId: req.params.id,
        changes: { blocked, reason },
        reason: reason,
        ipAddress: req.ip
    });

    res.status(200).json({ success: true, data: result });
});

export const checkSku = asyncHandler(async (req: Request, res: Response) => {
    const { sku, excludeId } = req.body;
    const available = await ProductService.checkSkuAvailable(sku, excludeId);
    res.status(200).json({ success: true, available });
});
