import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../../infra/stripe';
import { prisma } from '../../infra/database/client';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { EmailService } from '../../services/email.service';

export class WebhookController {
    static async handleStripeWebhook(req: Request, res: Response) {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!sig || !endpointSecret) {
            console.error('[Stripe Webhook] Missing signature or secret');
            return res.status(400).send('Webhook Error: Missing signature or secret');
        }

        let event: Stripe.Event;

        try {
            // Stripe signature verification
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err: any) {
            console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // 1. Idempotency Check: Store or retrieve the event
        const existingEvent = await prisma.webhookEvent.findUnique({
            where: { stripeEventId: event.id }
        });

        if (existingEvent && existingEvent.processed) {
            console.log(`[Stripe Webhook] Event ${event.id} already processed.`);
            return res.json({ received: true, processed: true, idempotency: 'HIT' });
        }

        // Store the event if it doesn't exist
        const webhookEvent = existingEvent || await prisma.webhookEvent.create({
            data: {
                stripeEventId: event.id,
                eventType: event.type,
                payload: JSON.stringify(event),
                processed: false
            }
        });

        try {
            // Handle the event
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object as Stripe.PaymentIntent;
                    await this.handlePaymentSucceeded(paymentIntent);
                    break;
                }

                case 'payment_intent.payment_failed': {
                    const paymentIntent = event.data.object as Stripe.PaymentIntent;
                    await this.handlePaymentFailed(paymentIntent);
                    break;
                }

                case 'charge.refunded': {
                    const charge = event.data.object as Stripe.Charge;
                    await this.handleChargeRefunded(charge);
                    break;
                }

                default:
                    console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
            }

            // Mark as processed
            await prisma.webhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    processed: true,
                    processedAt: new Date()
                }
            });

        } catch (error: any) {
            console.error(`[Stripe Webhook] Error processing event ${event.id}:`, error);

            await prisma.webhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    retryCount: { increment: 1 },
                    errorMessage: error.message
                }
            });

            return res.status(500).json({ success: false, error: 'Internal server error processing webhook' });
        }

        res.json({ received: true, processed: true });
    }

    private static async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
        console.log(`[Stripe Webhook] Processing successful payment for Intent: ${paymentIntent.id}`);

        const orders = await prisma.order.findMany({
            where: { stripeIntentId: paymentIntent.id },
            include: { items: { include: { product: true } } }
        });

        if (orders.length === 0) {
            console.warn(`[Stripe Webhook] No orders found for PaymentIntent: ${paymentIntent.id}`);
            return;
        }

        for (const order of orders) {
            // Avoid double processing if already paid (though idempotency check above handles this mostly)
            if (order.paymentStatus === PaymentStatus.PAID) continue;

            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: PaymentStatus.PAID,
                    status: OrderStatus.CONFIRMED, // Production flow: Payment Success -> Order Confirmed
                    paidAt: new Date(),
                    paymentMethod: paymentIntent.payment_method_types[0] || 'card',
                    statusHistory: {
                        create: {
                            status: OrderStatus.CONFIRMED,
                            notes: 'Payment confirmed via Stripe. Order moved to CONFIRMED state.'
                        }
                    }
                }
            });

            // Send Confirmation Email
            if (order.customerEmail) {
                await EmailService.sendOrderConfirmation(order.customerEmail, order).catch(e =>
                    console.error(`[Stripe Webhook] Email confirmation failed for order ${order.orderNumber}:`, e)
                );
            }

            // Notify the vendor
            try {
                const { NotificationService } = await import('../notification/service');
                await NotificationService.createNotification({
                    userId: order.vendorId,
                    title: 'New Order Received',
                    message: `Order ${order.orderNumber} is now PAID. Your earning: ₹${order.vendorEarnings.toFixed(2)}`,
                    type: 'order',
                    link: `/seller/orders/${order.id}`,
                });
            } catch (e) {
                console.error(`[Stripe Webhook] Vendor notification failed for order ${order.orderNumber}:`, e);
            }
        }
    }

    private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
        const error = paymentIntent.last_payment_error;
        const failureReason = this.mapStripeErrorCode(error?.code || '');

        console.log(`[Stripe Webhook] Processing failed payment for Intent: ${paymentIntent.id}. Reason: ${failureReason}`);

        await prisma.order.updateMany({
            where: { stripeIntentId: paymentIntent.id },
            data: {
                paymentStatus: PaymentStatus.FAILED,
                paymentFailureReason: failureReason
            }
        });

        const orders = await prisma.order.findMany({
            where: { stripeIntentId: paymentIntent.id }
        });

        for (const order of orders) {
            if (order.customerId) {
                try {
                    const { NotificationService } = await import('../notification/service');
                    await NotificationService.createNotification({
                        userId: order.customerId,
                        title: 'Payment Failed',
                        message: `Payment for order ${order.orderNumber} failed. Reason: ${error?.message || 'Transaction declined'}`,
                        type: 'alert',
                        link: `/checkout`, // Encourage retry
                    });
                } catch (e) {
                    console.error('[Stripe Webhook] Customer failed notification error:', e);
                }
            }
        }
    }

    private static async handleChargeRefunded(charge: Stripe.Charge) {
        const paymentIntentId = charge.payment_intent as string;
        if (!paymentIntentId) return;

        console.log(`[Stripe Webhook] Processing refund for PaymentIntent: ${paymentIntentId}`);

        const orders = await prisma.order.findMany({
            where: { stripeIntentId: paymentIntentId }
        });

        for (const order of orders) {
            const isFullRefund = charge.amount_refunded === charge.amount;

            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
                    status: isFullRefund ? OrderStatus.CANCELLED : order.status,
                    refundedAmount: (order.refundedAmount || 0) + (charge.amount_refunded / 100), // Stripe is in cents
                    statusHistory: {
                        create: {
                            status: isFullRefund ? OrderStatus.CANCELLED : order.status,
                            notes: `Refund processed via Stripe. Amount: ₹${(charge.amount_refunded / 100).toFixed(2)}`
                        }
                    }
                }
            });

            if (order.customerId) {
                try {
                    const { NotificationService } = await import('../notification/service');
                    await NotificationService.createNotification({
                        userId: order.customerId,
                        title: 'Refund Processed',
                        message: `A refund of ₹${(charge.amount_refunded / 100).toFixed(2)} for order ${order.orderNumber} has been processed.`,
                        type: 'order',
                        link: `/user/orders`,
                    });
                } catch (e) {
                    console.error('[Stripe Webhook] Customer refund notification error:', e);
                }
            }
        }
    }

    private static mapStripeErrorCode(code: string): any {
        const mapping: Record<string, string> = {
            'card_declined': 'DECLINED',
            'expired_card': 'EXPIRED_CARD',
            'incorrect_cvc': 'INVALID_CARD',
            'insufficient_funds': 'INSUFFICIENT_FUNDS',
            'processing_error': 'NETWORK_ERROR',
            'fraudulent': 'FRAUD_SUSPECTED'
        };
        return mapping[code] || 'DECLINED';
    }
}
