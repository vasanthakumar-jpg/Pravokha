import { Request, Response, NextFunction } from 'express';
import { OrderService } from './service';
import { createOrderSchema } from './schema';

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
            });

            res.status(201).json({
                success: true,
                message: 'Order created successfully. Please complete payment.',
                data: result,
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
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const { type, status, search, after } = req.query;

            const { orders, total } = await OrderService.listOrders(user.id, user.role, {
                page,
                limit,
                type: type as string,
                status: status as string,
                search: search as string,
                after: after as string
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
                trackingUpdates,
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

    static async ship(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { trackingNumber, trackingCarrier, version } = req.body;
            const user = (req as any).user;

            const order = await OrderService.markOrderAsShipped(id, {
                sellerId: user.id,
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
            const user = (req as any).user;

            await OrderService.refundOrder(id, user.role);

            res.status(200).json({
                success: true,
                message: 'Order refunded successfully',
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
