import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { PaymentStatus, OrderStatus, TransactionStatus } from '@prisma/client';
import { EmailService } from '../../services/email.service';
import { verifyWebhookSignature } from '../../infra/payment/razorpay';
import { RazorpayService } from '../payment/razorpay.service';

export class WebhookController {
    static async handleRazorpayWebhook(req: Request, res: Response) {
        const signature = req.headers['x-razorpay-signature'] as string;
        const rawBody = req.body.toString();

        if (!signature) {
            return res.status(400).json({ success: false, message: 'Missing signature' });
        }

        // 1. Verify Signature
        const isValid = verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            console.error('[Webhook] Invalid Razorpay signature');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        const event = JSON.parse(rawBody);
        console.log(`[Webhook] Razorpay event received: ${event.event}`);

        try {
            // Log the event for record/debug
            await prisma.webhookEvent.create({
                data: {
                    provider: 'RAZORPAY',
                    providerEventId: event.account_id + '_' + (event.payload.payment?.entity.id || event.id),
                    eventType: event.event,
                    payload: JSON.stringify(event)
                }
            });

            switch (event.event) {
                case 'payment.captured':
                    await WebhookController.handlePaymentCaptured(event.payload.payment.entity);
                    break;
                case 'payment.failed':
                    await WebhookController.handlePaymentFailed(event.payload.payment.entity);
                    break;
                case 'refund.processed':
                    await WebhookController.handleRefundProcessed(event.payload.refund.entity);
                    break;
                default:
                    console.log(`[Webhook] Unhandled event: ${event.event}`);
            }

            res.json({ success: true });
        } catch (error) {
            console.error('[Webhook] Error processing event:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    private static async handlePaymentCaptured(payment: any) {
        const razorpayOrderId = payment.order_id;
        const razorpayPaymentId = payment.id;

        const transaction = await prisma.paymentTransaction.findUnique({
            where: { razorpayOrderId }
        });

        if (!transaction) {
            console.warn(`[Webhook] Transaction not found for order ${razorpayOrderId}`);
            return;
        }

        if (transaction.status === TransactionStatus.PAID) return;

        await prisma.$transaction(async (tx) => {
            // Update Transaction
            await tx.paymentTransaction.update({
                where: { id: transaction.id },
                data: {
                    razorpayPaymentId,
                    status: TransactionStatus.PAID,
                    paymentMethod: payment.method,
                    paymentMethodDetails: JSON.stringify(payment.acquirer_data)
                }
            });

            // Update Primary Order
            const primaryOrder = await tx.order.findUnique({ where: { id: transaction.orderId } });
            if (primaryOrder) {
                await tx.order.update({
                    where: { id: primaryOrder.id },
                    data: {
                        paymentStatus: PaymentStatus.PAID,
                        status: OrderStatus.CONFIRMED,
                        paidAt: new Date(),
                        paymentIntentId: razorpayPaymentId
                    }
                });
            }

            // Update Linked Orders (multi-vendor)
            if (transaction.metadata) {
                const metadata = JSON.parse(transaction.metadata);
                if (metadata.otherOrderIds && Array.isArray(metadata.otherOrderIds)) {
                    for (const orderId of metadata.otherOrderIds) {
                        await tx.order.update({
                            where: { id: orderId },
                            data: {
                                paymentStatus: PaymentStatus.PAID,
                                status: OrderStatus.CONFIRMED,
                                paidAt: new Date(),
                                paymentIntentId: razorpayPaymentId
                            }
                        });
                    }
                }
            }
        });
    }

    private static async handlePaymentFailed(payment: any) {
        const razorpayOrderId = payment.order_id;

        await prisma.paymentTransaction.updateMany({
            where: { razorpayOrderId },
            data: {
                status: TransactionStatus.FAILED,
                errorCode: payment.error_code,
                errorDescription: payment.error_description
            }
        });
    }

    private static async handleRefundProcessed(refund: any) {
        const razorpayPaymentId = refund.payment_id;

        await prisma.paymentTransaction.update({
            where: { razorpayPaymentId },
            data: {
                refundStatus: 'COMPLETED',
                refundAmount: refund.amount / 100
            }
        });
    }
}
