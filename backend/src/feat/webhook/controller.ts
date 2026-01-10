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
            return res.status(400).send('Webhook Error: Missing signature or secret');
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err: any) {
            console.error(`Webhook Error: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);

                // Update Order Status Securely
                const order = await prisma.order.update({
                    where: { stripeIntentId: paymentIntent.id },
                    data: {
                        paymentStatus: PaymentStatus.PAID,
                        status: OrderStatus.PROCESSING,
                        paymentMethod: paymentIntent.payment_method_types[0],
                    },
                    include: { items: true }
                });

                // Send Confirmation Email
                await EmailService.sendOrderConfirmation(order.customerEmail, order);
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log(`PaymentIntent for ${paymentIntent.amount} failed.`);

                await prisma.order.update({
                    where: { stripeIntentId: paymentIntent.id },
                    data: {
                        paymentStatus: PaymentStatus.FAILED,
                    },
                });
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    }
}
