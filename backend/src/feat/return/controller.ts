import { Request, Response } from 'express';
import { returnService } from './service';
import { AuthRequest } from '../../shared/middleware/auth';

export class ReturnController {
    /**
     * Create return request
     */
    static async createRequest(req: AuthRequest, res: Response) {
        try {
            const { orderId, reason, images } = req.body;
            const customerId = req.user!.id;

            const returnRequest = await returnService.createReturnRequest({
                orderId,
                customerId,
                reason,
                images,
                refundAmount: req.body.refundAmount
            });

            res.status(201).json({
                success: true,
                data: returnRequest
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get return requests
     */
    static async getRequests(req: AuthRequest, res: Response) {
        try {
            const { status, limit, offset } = req.query;
            const role = req.user!.role;
            const userId = req.user!.id;

            const filters: any = {
                limit: limit ? parseInt(limit as string) : 20,
                offset: offset ? parseInt(offset as string) : 0
            };

            // Customers see only their returns
            if (role === 'CUSTOMER') {
                filters.customerId = userId;
            }

            if (status) {
                filters.status = status as any;
            }

            const returnRequests = await returnService.getReturnRequests(filters);

            res.json({
                success: true,
                data: returnRequests
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Approve return request (Admin only)
     */
    static async approveRequest(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const approvedBy = req.user!.id;

            const returnRequest = await returnService.approveReturn(id, approvedBy);

            res.json({
                success: true,
                data: returnRequest
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
    * Reject return request (Admin only)
     */
    static async rejectRequest(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const returnRequest = await returnService.rejectReturn(id, reason);

            res.json({
                success: true,
                data: returnRequest
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Process refund (Admin only)
     */
    static async processRefund(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const returnRequest = await returnService.processRefund(id);

            res.json({
                success: true,
                data: returnRequest,
                message: 'Refund processed successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}
