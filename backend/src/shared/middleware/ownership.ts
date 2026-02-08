import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../infra/database/client';

/**
 * Ownership Middleware - Enforces resource ownership for multi-vendor isolation
 * 
 * CRITICAL SECURITY: This middleware prevents IDOR (Insecure Direct Object Reference) attacks
 * by validating that a user can only access/modify resources they own.
 * 
 * ADMIN role bypasses all ownership checks (Super Admin privilege).
 * 
 * Update 2024: Roles have been renamed to SUPER_ADMIN (admin) and ADMIN (vendor).
 */

export interface OwnershipCheckOptions {
    resourceType: 'product' | 'order' | 'orderItem';
    resourceIdParam: string;  // Name of the route param containing resource ID
    ownerField: string;       // Field name in the resource that contains owner ID (e.g., 'vendorId')
}

/**
 * Generic ownership validation middleware
 * 
 * @example
 * router.put('/products/:id', authenticate, requireOwnership({
 *     resourceType: 'product',
 *     resourceIdParam: 'id',
 *     ownerField: 'dealerId'
 * }), updateProduct);
 */
export const requireOwnership = (options: OwnershipCheckOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // SUPER_ADMIN and ADMIN bypasses all ownership checks
            if (req.user.role === Role.SUPER_ADMIN || req.user.role === Role.ADMIN) {
                return next();
            }

            const resourceId = req.params[options.resourceIdParam];
            if (!resourceId) {
                return res.status(400).json({
                    success: false,
                    message: `Missing resource ID parameter: ${options.resourceIdParam}`
                });
            }

            // Fetch the resource to check ownership
            let resource: any;

            switch (options.resourceType) {
                case 'product':
                    resource = await prisma.product.findUnique({
                        where: { id: resourceId },
                        select: { id: true, vendorId: true }
                    });
                    break;

                case 'order':
                    resource = await prisma.order.findUnique({
                        where: { id: resourceId },
                        select: { id: true, customerId: true, vendorId: true }
                    });
                    break;

                case 'orderItem':
                    resource = await prisma.orderItem.findUnique({
                        where: { id: resourceId },
                        include: { order: { select: { vendorId: true } } }
                    });
                    break;

                default:
                    return res.status(500).json({
                        success: false,
                        message: 'Invalid resource type'
                    });
            }

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: `${options.resourceType} not found`
                });
            }

            // Check ownership
            const ownerId = resource[options.ownerField];

            // If it's a vendor (SELLER)
            if (req.user.role === Role.SELLER) {
                const vendor = await prisma.vendor.findUnique({ where: { ownerId: req.user.id } });

                if (options.resourceType === 'product') {
                    if (resource.vendorId === vendor?.id) return next();
                } else if (options.resourceType === 'order') {
                    if (resource.vendorId === vendor?.id) return next();
                } else if (options.resourceType === 'orderItem') {
                    if (resource.order?.vendorId === vendor?.id) return next();
                }

                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You do not have permission to access this resource'
                });
            }

            // Standard ownership check for CUSTOMER (formerly USER)
            if (ownerId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You do not have permission to access this resource'
                });
            }

            next();
        } catch (error) {
            console.error('Ownership validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during ownership validation'
            });
        }
    };
};

/**
 * Shorthand middleware for product ownership validation
 * Usage: router.put('/products/:id', authenticate, requireProductOwnership, updateProduct)
 */
export const requireProductOwnership = requireOwnership({
    resourceType: 'product',
    resourceIdParam: 'id',
    ownerField: 'vendorId'
});

/**
 * Validates that a SELLER can only view orders containing their products
 */
export const requireSellerOrderAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // SUPER_ADMIN and ADMIN can access all orders
        if (req.user.role === Role.SUPER_ADMIN || req.user.role === Role.ADMIN) {
            return next();
        }

        const orderId = req.params.id || req.params.orderId;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID required' });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, customerId: true, vendorId: true }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // CUSTOMER can only view their own orders
        if (req.user.role === Role.CUSTOMER) {
            if (order.customerId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You can only view your own orders'
                });
            }
            return next();
        }

        // SELLER (Vendor) can view orders belonging to their store
        if (req.user.role === Role.SELLER) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: req.user.id } });
            if (order.vendorId !== vendor?.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: This order does not belong to your store'
                });
            }
            return next();
        }

        // Shouldn't reach here, but deny by default
        return res.status(403).json({ success: false, message: 'Forbidden' });

    } catch (error) {
        console.error('Order access validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Validates that the authenticated seller (SELLER) owns the order.
 */
export const requireOrderOwnership = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // SUPER_ADMIN and ADMIN bypass all ownership checks
        if (req.user.role === Role.SUPER_ADMIN || req.user.role === Role.ADMIN) {
            return next();
        }

        const orderId = req.params.id || req.params.orderId;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID required for ownership check' });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, vendorId: true }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if the user is a vendor (SELLER) and owns this order
        if (req.user.role === Role.SELLER) {
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: req.user.id } });
            if (order.vendorId === vendor?.id) {
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have permission to access this order'
        });

    } catch (error) {
        console.error('Order ownership error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error during authorization' });
    }
};
