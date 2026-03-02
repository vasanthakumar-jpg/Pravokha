import { PrismaClient, ReturnStatus } from '@prisma/client';
import { emailService } from '../email/service';
import { RazorpayService } from '../payment/razorpay.service';

const prisma = new PrismaClient();

export class ReturnService {
    /**
     * Create a return request
     */
    async createReturnRequest(data: {
        orderId: string;
        customerId: string;
        reason: string;
        images?: string[];
        refundAmount: number;
    }) {
        // Verify order exists and belongs to customer
        const order = await prisma.order.findFirst({
            where: {
                id: data.orderId,
                customerId: data.customerId,
                status: { in: ['DELIVERED', 'CONFIRMED'] }
            },
            include: {
                customer: true
            }
        });

        if (!order) {
            throw new Error('Order not found or cannot be returned');
        }

        // Create return request
        const returnRequest = await prisma.returnRequest.create({
            data: {
                orderId: data.orderId,
                customerId: data.customerId,
                reason: data.reason,
                images: data.images ? JSON.stringify(data.images) : null,
                refundAmount: data.refundAmount,
                status: ReturnStatus.REQUESTED
            }
        });

        // Send email notification to customer
        await emailService.sendEmail({
            to: order.customer!.email,
            subject: 'Return Request Received',
            template: 'returnReceived',
            variables: {
                customerName: order.customer!.name || 'Customer',
                orderNumber: order.orderNumber,
                requestId: returnRequest.id
            }
        });

        return returnRequest;
    }

    /**
     * Approve return request
     */
    async approveReturn(returnId: string, approvedBy: string) {
        const returnRequest = await prisma.returnRequest.update({
            where: { id: returnId },
            data: {
                status: ReturnStatus.APPROVED,
                approvedBy,
                approvedAt: new Date()
            },
            include: {
                order: {
                    include: {
                        customer: true
                    }
                }
            }
        });

        // Send approval email
        if (returnRequest.order.customer) {
            await emailService.sendEmail({
                to: returnRequest.order.customer.email,
                subject: 'Return Request Approved',
                template: 'returnApproved',
                variables: {
                    customerName: returnRequest.order.customer.name || 'Customer',
                    orderNumber: returnRequest.order.orderNumber,
                    refundAmount: returnRequest.refundAmount
                }
            });
        }

        return returnRequest;
    }

    /**
     * Reject return request
     */
    async rejectReturn(returnId: string, rejectedReason: string) {
        const returnRequest = await prisma.returnRequest.update({
            where: { id: returnId },
            data: {
                status: ReturnStatus.REJECTED,
                rejectedReason
            },
            include: {
                order: {
                    include: {
                        customer: true
                    }
                }
            }
        });

        // Send rejection email
        if (returnRequest.order.customer) {
            await emailService.sendEmail({
                to: returnRequest.order.customer.email,
                subject: 'Return Request Update',
                template: 'returnRejected',
                variables: {
                    customerName: returnRequest.order.customer.name || 'Customer',
                    orderNumber: returnRequest.order.orderNumber,
                    reason: rejectedReason
                }
            });
        }

        return returnRequest;
    }

    /**
     * Process refund via Razorpay
     */
    async processRefund(returnId: string) {
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: returnId },
            include: {
                order: {
                    include: {
                        paymentTransactions: true,
                        customer: true
                    }
                }
            }
        });

        if (!returnRequest || returnRequest.status !== ReturnStatus.APPROVED) {
            throw new Error('Return request not found or not approved');
        }

        // Get payment transaction
        const transaction = returnRequest.order.paymentTransactions[0];
        if (!transaction || !transaction.razorpayPaymentId) {
            throw new Error('Payment transaction not found');
        }

        // Create real refund via Razorpay
        try {
            await RazorpayService.initiateRefund(
                transaction.razorpayPaymentId,
                returnRequest.refundAmount,
                `Refund for Returned Items (Order: ${returnRequest.order.orderNumber})`
            );
        } catch (error: any) {
            console.error('[ReturnService] Razorpay Refund Failed:', error.message);
            throw new Error(`Financial refund failed: ${error.message}`);
        }

        // Update return status and order
        await prisma.$transaction([
            prisma.returnRequest.update({
                where: { id: returnId },
                data: { status: ReturnStatus.REFUNDED }
            }),
            prisma.order.update({
                where: { id: returnRequest.orderId },
                data: {
                    status: 'REFUNDED',
                    paymentStatus: 'REFUNDED',
                    refundedAmount: returnRequest.refundAmount,
                    refundedAt: new Date(),
                    refundReason: returnRequest.reason
                }
            })
        ]);

        // Audit Log
        const { AuditService } = await import('../../shared/service/audit.service');
        await AuditService.logAction({
            performedBy: 'SYSTEM/ADMIN', // Usually called by an admin
            performerRole: 'ADMIN',
            action: 'RETURN_REFUND_PROCESSED',
            entity: 'ReturnRequest',
            entityId: returnId,
            reason: `Successfully processed Razorpay refund for Order ${returnRequest.order.orderNumber}`,
            changes: { amount: returnRequest.refundAmount }
        });

        // Send refund confirmation email
        const { EmailService } = await import('../../shared/service/email.service');
        await EmailService.sendRefundConfirmation(
            (returnRequest.order.customer?.email || returnRequest.order.customerEmail) as string,
            returnRequest.order.orderNumber,
            returnRequest.refundAmount,
            (returnRequest.order.customer?.name || returnRequest.order.customerName) as string
        );

        return { success: true, message: 'Refund processed successfully' };
    }

    /**
     * Get return requests by filters
     */
    async getReturnRequests(filters: {
        customerId?: string;
        status?: ReturnStatus;
        limit?: number;
        offset?: number;
    }) {
        return await prisma.returnRequest.findMany({
            where: {
                ...(filters.customerId && { customerId: filters.customerId }),
                ...(filters.status && { status: filters.status })
            },
            include: {
                order: true,
                customer: true
            },
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 20,
            skip: filters.offset || 0
        });
    }
}

export const returnService = new ReturnService();
