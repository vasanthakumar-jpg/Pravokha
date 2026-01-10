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
            const orders = await OrderService.listOrders(user.id, user.role);

            res.status(200).json({
                success: true,
                data: orders,
            });
        } catch (error) {
            next(error);
        }
    }

    static async cancelOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            const order = await OrderService.cancelOrder(id, user.id, user.role);

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
            const { status, trackingUpdates } = req.body;
            const user = (req as any).user;

            const order = await OrderService.updateOrderStatus(id, status, trackingUpdates, user.role);

            res.status(200).json({
                success: true,
                message: 'Order status updated successfully',
                data: order,
            });
        } catch (error) {
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
}
