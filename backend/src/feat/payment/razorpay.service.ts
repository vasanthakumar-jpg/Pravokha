import { prisma } from '../../infra/database/client';
import { razorpayInstance } from '../../infra/payment/razorpay';
import { TransactionStatus, PaymentStatus, OrderStatus } from '@prisma/client';
import { Orders } from 'razorpay/dist/types/orders';

export class RazorpayService {
    /**
     * Creates a Razorpay order for an existing system order
     */
    static async createRazorpayOrder(orderId: string, amount: number, currency: string = 'INR') {
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency: currency,
            receipt: `receipt_${orderId}`,
            partial_payment: false,
        };

        try {
            const razorpayOrder = await razorpayInstance.orders.create(options);

            // Create a PaymentTransaction record in CREATED state
            await prisma.paymentTransaction.create({
                data: {
                    orderId: orderId,
                    razorpayOrderId: razorpayOrder.id,
                    amount: amount,
                    currency: currency,
                    status: TransactionStatus.CREATED,
                }
            });

            return razorpayOrder;
        } catch (error) {
            console.error('[RazorpayService] Failed to create order:', error);
            throw new Error('Failed to initialize payment with provider');
        }
    }

    /**
     * Processes a successful payment verification
     */
    static async handlePaymentSuccess(
        orderId: string,
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string
    ) {
        return await prisma.$transaction(async (tx) => {
            // Update the transaction
            // Update the transaction
            const transaction = await tx.paymentTransaction.update({
                where: { razorpayOrderId: razorpayOrderId },
                data: {
                    razorpayPaymentId: razorpayPaymentId,
                    razorpaySignature: razorpaySignature,
                    status: TransactionStatus.PAID,
                }
            });

            // Parse metadata to find other linked orders (multi-vendor support)
            let orderIds = [orderId];
            if (transaction.metadata) {
                try {
                    const metadata = JSON.parse(transaction.metadata);
                    if (metadata.otherOrderIds && Array.isArray(metadata.otherOrderIds)) {
                        orderIds = [...orderIds, ...metadata.otherOrderIds];
                    }
                } catch (e) {
                    console.error('Failed to parse payment metadata:', e);
                }
            }

            // Update all linked orders
            await tx.order.updateMany({
                where: { id: { in: orderIds } },
                data: {
                    paymentStatus: PaymentStatus.PAID,
                    status: OrderStatus.CONFIRMED,
                    paidAt: new Date(),
                    paymentIntentId: razorpayPaymentId,
                    updatedAt: new Date()
                }
            });

            // Create status history for each order
            for (const oid of orderIds) {
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: oid,
                        status: OrderStatus.CONFIRMED,
                        notes: 'Payment verified via Razorpay'
                    }
                });
            }

            return { success: true };
        });
    }

    /**
     * Handles COD order by creating a PENDING PaymentTransaction
     */
    static async handleCODPayment(orderId: string, amount: number) {
        return await prisma.paymentTransaction.create({
            data: {
                orderId: orderId,
                amount: amount,
                status: TransactionStatus.PENDING,
                paymentMethod: 'COD',
            }
        });
    }

    /**
     * Initiates a refund via Razorpay
     */
    static async initiateRefund(paymentId: string, amount?: number, notes?: string) {
        try {
            const refund = await razorpayInstance.payments.refund(paymentId, {
                amount: amount ? Math.round(amount * 100) : undefined,
                notes: { reason: notes || 'Customer request' }
            });

            // Update transaction to reflect refund in progress
            await prisma.paymentTransaction.update({
                where: { razorpayPaymentId: paymentId },
                data: {
                    refundId: refund.id,
                    refundStatus: 'PROCESSING',
                }
            });

            return refund;
        } catch (error) {
            console.error('[RazorpayService] Refund failed:', error);
            throw error;
        }
    }
}
