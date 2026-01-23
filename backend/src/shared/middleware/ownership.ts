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
 */

export interface OwnershipCheckOptions {
    resourceType: 'product' | 'order' | 'orderItem';
    resourceIdParam: string;  // Name of the route param containing resource ID
    ownerField: string;       // Field name in the resource that contains owner ID (e.g., 'dealerId')
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

            // ADMIN bypasses all ownership checks
            if (req.user.role === Role.ADMIN) {
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
                        select: { id: true, dealerId: true }
                    });
                    break;
                
                case 'order':
                    resource = await prisma.order.findUnique({
                        where: { id: resourceId },
                        select: { id: true, userId: true, items: { select: { sellerId: true } } }
                    });
                    break;

                case 'orderItem':
                    resource = await prisma.orderItem.findUnique({
                        where: { id: resourceId },
                        select: { id: true, sellerId: true }
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
            
            // Special case for orders: DEALER can access if ANY item belongs to them
            if (options.resourceType === 'order' && req.user.role === Role.DEALER) {
                const hasSellerItem = resource.items?.some((item: any) => item.sellerId === req.user!.id);
                if (hasSellerItem) {
                    return next();
                }
            }

            // Standard ownership check
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
    ownerField: 'dealerId'
});

/**
 * Validates that a DEALER can only view orders containing their products
 */
export const requireDealerOrderAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // ADMIN can access all orders
        if (req.user.role === Role.ADMIN) {
            return next();
        }

        const orderId = req.params.id || req.params.orderId;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID required' });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { select: { sellerId: true } } }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // CUSTOMER can only view their own orders
        if (req.user.role === Role.USER) {
            if (order.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You can only view your own orders'
                });
            }
            return next();
        }

        // DEALER can view orders containing at least one of their products
        if (req.user.role === Role.DEALER) {
            const hasSellerItem = order.items.some(item => item.sellerId === req.user!.id);
            if (!hasSellerItem) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: This order does not contain your products'
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
