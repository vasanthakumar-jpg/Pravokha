import { NextFunction, Request, Response } from 'express';
import { OrderService } from './service';
import { createOrderSchema } from './schema';
import { Role } from '@prisma/client';
import { isSeller } from '../../shared/utils/role.utils';
import { prisma } from '../../infra/database/client';
import { ShippingService } from '../../services/ShippingService';

export class OrderController {
    static async createOrder(req: Request, res: Response, next: NextFunction) {
        try {
            // Validation
            const validatedData = createOrderSchema.parse(req.body);

            // User ID from Auth Middleware
            const userId = (req as any).user?.id;

            const result = await OrderService.createOrder({
                ...validatedData,
                userId,
                // Ensure customer details are passed if not in body (optional fallback)
                customerName: validatedData.customerName || (req as any).user?.name || 'Guest',
                customerEmail: validatedData.customerEmail || (req as any).user?.email,
                customerPhone: validatedData.customerPhone || (req as any).user?.phone || '0000000000',
            });

            res.status(201).json({
                success: true,
                message: 'Orders created successfully.',
                data: result, // { orders: [], clientSecret, grandTotal }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            const order = await OrderService.getOrderById(id, user.id, user.role);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found',
                });
            }

            res.status(200).json({
                success: true,
                data: order,
            });
        } catch (error) {
            next(error);
        }
    }

    static async listOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const { type, status, search, after, skip, take } = req.query;
            const limit = take ? parseInt(take as string) : (parseInt(req.query.limit as string) || 10);
            const page = skip ? (Math.floor(parseInt(skip as string) / limit) + 1) : (parseInt(req.query.page as string) || 1);

            let vendorId: string | undefined;
            if (isSeller(user.role)) {
                const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.id } });
                vendorId = vendor?.id;
            }

            const { orders, total } = await OrderService.listOrders(user.id, user.role, {
                page,
                limit,
                type: type as string,
                status: status as string,
                search: search as string,
                after: after as string,
                vendorId: vendorId // Added vendorId filtering
            });

            res.status(200).json({
                success: true,
                data: orders,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const stats = await OrderService.getOrderStats(user.id, user.role);

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }

    static async cancelOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            const { reason, comments } = req.body;
            const order = await OrderService.cancelOrder(id, user.id, user.role, reason, comments);

            res.status(200).json({
                success: true,
                message: 'Order cancelled successfully',
                data: order,
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, trackingNumber, trackingCarrier, trackingUpdates, version, packingNotes } = req.body;
            const user = (req as any).user;

            const order = await OrderService.updateOrderStatus(id, status, {
                userId: user.id,
                role: user.role,
                trackingNumber,
                trackingCarrier,
                packingNotes,
                version: version !== undefined ? parseInt(version.toString()) : undefined
            });

            res.status(200).json({
                success: true,
                message: 'Order status updated successfully',
                data: order,
            });
        } catch (error: any) {
            if (error.message.includes('Concurrency conflict')) {
                return res.status(409).json({ success: false, message: error.message });
            }
            if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
                return res.status(403).json({ success: false, message: error.message });
            }
            if (error.message.includes('Invalid status transition') || error.message.includes('Required field missing')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            next(error);
        }
    }

    static async calculateShipping(req: Request, res: Response, next: NextFunction) {
        try {
            const { items, pincode, isCod, isExpress } = req.body;
            if (!items || !pincode) {
                return res.status(400).json({ success: false, message: 'Items and pincode are required' });
            }

            const result = await ShippingService.calculateShipping(items, pincode, isCod, isExpress);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async ship(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { trackingNumber, trackingCarrier, version } = req.body;
            const user = (req as any).user;

            // In multi-vendor, ship is for a specific order (which is per vendor anyway)
            const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.id } });

            const order = await OrderService.markOrderAsShipped(id, {
                vendorId: vendor?.id || '', // Use vendorId instead of sellerId
                trackingNumber,
                trackingCarrier,
                version: version !== undefined ? parseInt(version.toString()) : undefined
            });

            res.status(200).json({
                success: true,
                message: 'Order marked as shipped successfully',
                data: order,
            });
        } catch (error: any) {
            if (error.message.includes('Concurrency conflict')) {
                return res.status(409).json({ success: false, message: error.message });
            }
            next(error);
        }
    }

    static async deleteOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            await OrderService.deleteOrder(id, user.role);

            res.status(200).json({
                success: true,
                message: 'Order deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    static async restoreOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            await OrderService.restoreOrder(id, user.role);

            res.status(200).json({
                success: true,
                message: 'Order restored successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    static async refundOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { amount, reason, restoreInventory } = req.body;
            const user = (req as any).user;

            const updatedOrder = await OrderService.refundOrder(id, user.id, user.role, {
                amount: amount ? parseFloat(amount) : undefined,
                reason,
                restoreInventory: restoreInventory === true || restoreInventory === 'true'
            });

            res.status(200).json({
                success: true,
                message: 'Refund processed successfully.',
                data: updatedOrder
            });
        } catch (error) {
            next(error);
        }
    }

    static async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            const history = await OrderService.getOrderHistory(id, user.id, user.role);

            res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error) {
            next(error);
        }
    }
    static async updateItemStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: orderId, itemId } = req.params;
            const user = (req as any).user;
            const { status, trackingNumber, trackingCarrier } = req.body;

            const updatedItem = await OrderService.updateItemStatus(orderId, itemId, user.id, user.role, {
                status,
                trackingNumber,
                trackingCarrier
            });

            res.status(200).json({
                success: true,
                message: 'Item status updated successfully',
                data: updatedItem
            });
        } catch (error) {
            next(error);
        }
    }
}
